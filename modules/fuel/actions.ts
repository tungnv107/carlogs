"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { vnLocalDateTime } from "@/lib/operations-rules";
import { fuelSchema } from "./schema";
import { sameFuelSubmission } from "@/lib/linked-idempotency";
import { allowedEnergyUnit, fuelAmountVND } from "@/lib/fuel-rules";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFuelLog(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER"]);
  const parsed = fuelSchema.safeParse({ ...Object.fromEntries(form.entries()), isFullTank: form.get("isFullTank") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const entry = parsed.data;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: entry.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" }, ...vehicleScope(membership.role, user.id) } });
  if (!vehicle) return { error: "Xe không thuộc quyền truy cập." };
  if (!allowedEnergyUnit(vehicle.fuelType, entry.unit)) return { error: "Đơn vị năng lượng không phù hợp với xe." };
  const categoryName = entry.unit === "KWH" ? "Sạc điện" : vehicle.fuelType === "DIESEL" ? "Dầu diesel" : "Xăng";
  const category = await prisma.expenseCategory.findFirst({ where: { organizationId: organization.id, name: categoryName, group: "Nhiên liệu", active: true } });
  if (!category) return { error: `Chưa có danh mục ${categoryName} được kích hoạt.` };
  const quantity = new Prisma.Decimal(entry.quantity);
  const unitPrice = new Prisma.Decimal(entry.unitPrice);
  const amount = fuelAmountVND(quantity, unitPrice);
  if (amount.lte(0) || amount.gt("999999999999999")) return { error: "Tổng tiền phải là số VND nguyên dương và nằm trong giới hạn." };
  const occurredAt = vnLocalDateTime(entry.occurredAt);
  const incoming = { createdById: user.id, vehicleId: vehicle.id, categoryId: category.id, occurredAt, amount, odometer: entry.odometer, unit: entry.unit, quantity, unitPrice, isFullTank: entry.isFullTank, vendor: entry.vendor };
  try {
    await prisma.$transaction(async tx => {
      // Unique ledger idempotency key remains the final arbiter of repeated requests.
      const existing = await tx.expense.findUnique({ where: { organizationId_idempotencyKey: { organizationId: organization.id, idempotencyKey: entry.idempotencyKey } }, include: { fuelLog: true } });
      if (existing) {
        if (!sameFuelSubmission(existing, incoming)) throw new Error("Mã lưu đã được dùng cho dữ liệu khác.");
        return;
      }
      const expense = await tx.expense.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, categoryId: category.id, occurredAt, amount, odometer: entry.odometer, vendor: entry.vendor, description: `${entry.quantity} ${entry.unit === "LITER" ? "L" : "kWh"} × ${entry.unitPrice} VND`, createdById: user.id, idempotencyKey: entry.idempotencyKey } });
      await tx.fuelLog.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, expenseId: expense.id, occurredAt, odometer: entry.odometer, unit: entry.unit, quantity, unitPrice, isFullTank: entry.isFullTank, vendor: entry.vendor, createdById: user.id } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "FuelLog", entityId: expense.id, action: "CREATE", after: { vehicleId: vehicle.id, amount: amount.toString(), quantity: quantity.toString(), unit: entry.unit } } });
      await tx.vehicle.updateMany({ where: { id: vehicle.id, organizationId: organization.id, odometer: { lt: entry.odometer } }, data: { odometer: entry.odometer } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // The first concurrent request may have committed the identical payload.
      const existing = await prisma.expense.findUnique({ where: { organizationId_idempotencyKey: { organizationId: organization.id, idempotencyKey: entry.idempotencyKey } }, include: { fuelLog: true } });
      if (!existing || !sameFuelSubmission(existing, incoming)) return { error: "Mã lưu đã được dùng cho dữ liệu khác." };
    } else {
      return { error: error instanceof Error && error.message.startsWith("Mã lưu") ? error.message : "Không thể lưu nhiên liệu. Dữ liệu trên form vẫn được giữ." };
    }
  }
  revalidatePath("/fuel");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/expenses");
  revalidatePath(`/vehicles/${vehicle.id}`);
  redirect("/fuel?created=1");
}
