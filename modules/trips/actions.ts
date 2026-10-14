"use server";

import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { vnLocalDateTime } from "@/lib/operations-rules";
import { tripSchema, odometerCorrectionSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTrip(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "DRIVER"]);
  const parsed = tripSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const trip = parsed.data;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: trip.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" }, ...vehicleScope(membership.role, user.id) } });
  if (!vehicle) return { error: "Xe không hợp lệ hoặc chưa được phân công." };
  const driverId = membership.role === "DRIVER" ? user.id : (trip.driverId || user.id);
  const driver = await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: organization.id, userId: driverId } } });
  if (!driver || driver.status !== "ACTIVE") return { error: "Người lái không thuộc không gian hiện tại." };
  const startedAt = vnLocalDateTime(trip.startedAt);
  const endedAt = vnLocalDateTime(trip.endedAt);
  try {
    await prisma.$transaction(async tx => {
      // Serialize all trip inserts per vehicle, preventing concurrent overlap races.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${vehicle.id}))`;
      const overlappingTime = await tx.tripLog.findFirst({ where: { vehicleId: vehicle.id, organizationId: organization.id, startedAt: { lt: endedAt }, endedAt: { gt: startedAt } } });
      if (overlappingTime) throw new Error("Khoảng thời gian trùng với hành trình đã ghi.");
      const conflictingKm = await tx.tripLog.findFirst({ where: { vehicleId: vehicle.id, organizationId: organization.id, odometerStart: { lt: trip.odometerEnd }, odometerEnd: { gt: trip.odometerStart } } });
      if (conflictingKm) throw new Error("Khoảng km chồng lấn với hành trình đã ghi.");
      const preceding = await tx.tripLog.findFirst({ where: { vehicleId: vehicle.id, startedAt: { lte: startedAt } }, orderBy: { startedAt: "desc" } });
      const following = await tx.tripLog.findFirst({ where: { vehicleId: vehicle.id, startedAt: { gte: endedAt } }, orderBy: { startedAt: "asc" } });
      if ((preceding && preceding.odometerEnd > trip.odometerStart) || (following && following.odometerStart < trip.odometerEnd)) throw new Error("Mốc km không theo thứ tự hành trình.");
      const created = await tx.tripLog.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, driverId, createdById: user.id, startedAt, endedAt, odometerStart: trip.odometerStart, odometerEnd: trip.odometerEnd, distance: trip.odometerEnd - trip.odometerStart, purpose: trip.purpose, notes: trip.notes } });
      await tx.vehicle.updateMany({ where: { id: vehicle.id, organizationId: organization.id, odometer: { lt: trip.odometerEnd } }, data: { odometer: trip.odometerEnd } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "TripLog", entityId: created.id, action: "CREATE", after: { vehicleId: vehicle.id, start: trip.odometerStart, end: trip.odometerEnd } } });
    });
  } catch (error) {
    return { error: error instanceof Error && /^(Khoảng|Mốc km)/.test(error.message) ? error.message : "Không lưu được hành trình, vui lòng thử lại." };
  }
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  revalidatePath(`/vehicles/${vehicle.id}`);
  redirect("/trips?created=1");
}

export async function correctOdometer(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const parsed = odometerCorrectionSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const value = parsed.data;
  try {
    await prisma.$transaction(async tx => {
      const vehicle = await tx.vehicle.findFirst({ where: { id: value.vehicleId, organizationId: organization.id } });
      if (!vehicle || vehicle.status === "ARCHIVED") throw new Error("Không tìm thấy xe đang sử dụng.");
      if (vehicle.odometer === value.adjustedValue) throw new Error("Giá trị km mới phải khác giá trị hiện tại.");
      const result = await tx.vehicle.updateMany({ where: { id: vehicle.id, organizationId: organization.id, odometer: vehicle.odometer }, data: { odometer: value.adjustedValue } });
      if (result.count !== 1) throw new Error("Km vừa được người khác thay đổi, hãy tải lại.");
      await tx.odometerCorrection.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, previousValue: vehicle.odometer, adjustedValue: value.adjustedValue, reason: value.reason, actorId: user.id } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "Vehicle", entityId: vehicle.id, action: "ODOMETER_CORRECTION", before: { odometer: vehicle.odometer }, after: { odometer: value.adjustedValue, reason: value.reason } } });
    });
  } catch (error) { return { error: error instanceof Error ? error.message : "Không lưu được điều chỉnh." }; }
  revalidatePath("/vehicles");
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  redirect(`/vehicles/${value.vehicleId}?corrected=1`);
}
