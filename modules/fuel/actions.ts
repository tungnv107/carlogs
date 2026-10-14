"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope, canModifyExpense } from "@/lib/access-scope";
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

function refreshFuelViews(vehicleId: string) {
  for (const path of ["/fuel", "/expenses", "/dashboard", "/reports", `/vehicles/${vehicleId}`]) revalidatePath(path);
}

export async function updateFuelLog(id: string, _previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER"]);
  const parsed = fuelSchema.omit({ idempotencyKey: true }).safeParse({ ...Object.fromEntries(form.entries()), isFullTank: form.get("isFullTank") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const log = await prisma.fuelLog.findFirst({ where: { id, organizationId: organization.id }, include: { expense: true, vehicle: true } });
  if (!log || log.vehicleId !== v.vehicleId || log.expense.status !== "POSTED" || !canModifyExpense(membership.role, user.id, log.createdById, log.vehicle.assignedToId)) return { error: "Không có quyền sửa hoặc giao dịch đã hủy." };
  if (!allowedEnergyUnit(log.vehicle.fuelType, v.unit)) return { error: "Đơn vị năng lượng không phù hợp với xe." };
  const categoryName = v.unit === "KWH" ? "Sạc điện" : log.vehicle.fuelType === "DIESEL" ? "Dầu diesel" : "Xăng";
  const category = await prisma.expenseCategory.findFirst({ where: { organizationId: organization.id, name: categoryName, group: "Nhiên liệu", active: true } });
  if (!category) return { error: `Chưa có danh mục ${categoryName} được kích hoạt.` };
  const amount = fuelAmountVND(new Prisma.Decimal(v.quantity), new Prisma.Decimal(v.unitPrice));
  if (amount.lte(0) || amount.gt("999999999999999")) return { error: "Tổng tiền phải là số VND nguyên dương và nằm trong giới hạn." };
  try {
    await prisma.$transaction(async tx => {
      const changed = await tx.expense.updateMany({ where: { id: log.expenseId, organizationId: organization.id, status: "POSTED" }, data: { categoryId: category.id, occurredAt: vnLocalDateTime(v.occurredAt), amount, odometer: v.odometer, vendor: v.vendor, description: `${v.quantity} ${v.unit === "LITER" ? "L" : "kWh"} × ${v.unitPrice} VND` } });
      if (changed.count !== 1) throw new Error("Giao dịch đã bị hủy hoặc thay đổi.");
      await tx.fuelLog.update({ where: { id }, data: { occurredAt: vnLocalDateTime(v.occurredAt), odometer: v.odometer, unit: v.unit, quantity: new Prisma.Decimal(v.quantity), unitPrice: new Prisma.Decimal(v.unitPrice), isFullTank: v.isFullTank, vendor: v.vendor } });
      await tx.vehicle.updateMany({ where: { id: log.vehicleId, organizationId: organization.id, odometer: { lt: v.odometer } }, data: { odometer: v.odometer } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "FuelLog", entityId: id, action: "UPDATE", before: { amount: log.expense.amount.toString(), quantity: log.quantity.toString(), unitPrice: log.unitPrice.toString() }, after: { amount: amount.toString(), quantity: v.quantity, unitPrice: v.unitPrice } } });
    });
  } catch { return { error: "Không cập nhật được nhiên liệu. Vui lòng tải lại và thử lại." }; }
  refreshFuelViews(log.vehicleId);
  redirect("/fuel?updated=1");
}

export async function deleteFuelLog(id: string) {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER"]);
  const log = await prisma.fuelLog.findFirst({ where: { id, organizationId: organization.id }, include: { expense: true, vehicle: true } });
  if (!log || !canModifyExpense(membership.role, user.id, log.createdById, log.vehicle.assignedToId)) throw new Error("Không có quyền xóa lần tiếp nhiên liệu.");
  await prisma.$transaction(async tx => {
    const updated = await tx.expense.updateMany({ where: { id: log.expenseId, organizationId: organization.id, status: "POSTED" }, data: { status: "VOID" } });
    if (updated.count !== 1) throw new Error("Giao dịch đã hủy hoặc không còn hợp lệ.");
    await tx.fuelLog.delete({ where: { id } });
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "FuelLog", entityId: id, action: "DELETE", before: { vehicleId: log.vehicleId, expenseId: log.expenseId, quantity: log.quantity.toString() } } });
  });
  refreshFuelViews(log.vehicleId);
  redirect("/fuel?deleted=1");
}
