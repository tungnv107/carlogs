"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { vnDateToUTC } from "@/lib/finance";
import { expenseSchema } from "./schema";
import { prepareReceipt, writeReceipt, removeReceipt } from "@/lib/receipts";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canModifyExpense, expenseScope, vehicleScope } from "@/lib/access-scope";
import { sameExpenseSubmission } from "@/lib/expense-idempotency";

const writeRoles = ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER"] as const;

export async function createExpense(_prev: { error: string }, form: FormData): Promise<{ error: string }> {
  const { organization, user, membership } = await requireOrganizationAccess([...writeRoles]);
  const parsed = expenseSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const e = parsed.data;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: e.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" }, ...vehicleScope(membership.role, user.id) } });
  const category = await prisma.expenseCategory.findFirst({ where: { id: e.categoryId, organizationId: organization.id, active: true } });
  if (!vehicle || !category) return { error: "Xe hoặc danh mục không hợp lệ." };
  // Check before receiving files. The unique DB constraint below remains the
  // final authority when two requests with the same key race concurrently.
  const prior = await prisma.expense.findUnique({ where: { organizationId_idempotencyKey: {
    organizationId: organization.id, idempotencyKey: e.idempotencyKey
  } } });
  const payload = {
    createdById: user.id, vehicleId: e.vehicleId, categoryId: e.categoryId,
    occurredAt: vnDateToUTC(e.date), amount: e.amount, odometer: e.odometer,
    vendor: e.vendor, description: e.description, paymentMethod: e.paymentMethod
  };
  if (prior) {
    if (!sameExpenseSubmission(prior, payload)) return { error: "Mã giao dịch đã dùng cho nội dung khác. Tải lại biểu mẫu và thử lại." };
    redirect(form.get("submitMode") === "next" ? "/expenses/new?created=1" : "/expenses?created=1");
  }
  let receipt: Awaited<ReturnType<typeof prepareReceipt>>;
  try {
    receipt = await prepareReceipt(form.get("receipt") instanceof File ? form.get("receipt") as File : null);
    if (receipt) await writeReceipt(receipt);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Không thể nhận hóa đơn." };
  }
  try {
    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({ data: {
        organizationId: organization.id, vehicleId: vehicle.id, categoryId: category.id,
        occurredAt: payload.occurredAt, amount: new Prisma.Decimal(e.amount),
        odometer: e.odometer === "" ? null : e.odometer,
        vendor: e.vendor, description: e.description, paymentMethod: e.paymentMethod,
        createdById: user.id, idempotencyKey: e.idempotencyKey
      } });
      await tx.auditLog.create({ data: {
        organizationId: organization.id, actorId: user.id,
        entityType: "Expense", entityId: expense.id, action: "CREATE",
        after: { amount: e.amount, vehicleId: vehicle.id, categoryId: category.id }
      } });
      if (receipt) await tx.attachment.create({ data: {
        organizationId: organization.id, expenseId: expense.id,
        objectKey: receipt.objectKey, originalName: receipt.originalName,
        mimeType: receipt.mimeType, size: receipt.size
      } });
    });
  } catch (error) {
    if (receipt) await removeReceipt(receipt.objectKey);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // The same submission was already accepted; never insert a second transaction.
      const original = await prisma.expense.findUnique({ where: { organizationId_idempotencyKey: {
        organizationId: organization.id, idempotencyKey: e.idempotencyKey
      } } });
      if (!original || !sameExpenseSubmission(original, payload)) return { error: "Mã giao dịch đã dùng cho nội dung khác. Tải lại biểu mẫu và thử lại." };
    } else return { error: "Chưa lưu được chi phí. Dữ liệu vẫn ở biểu mẫu, hãy thử lại." };
  }
  revalidatePath("/dashboard");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicle.id}`);
  revalidatePath("/expenses");
  redirect(form.get("submitMode") === "next" ? "/expenses/new?created=1" : "/expenses?created=1");
}

export async function updateExpense(id: string, form: FormData) {
  const { organization, user, membership } = await requireOrganizationAccess([...writeRoles]);
  const expense = await prisma.expense.findFirst({ where: { id, organizationId: organization.id, ...expenseScope(membership.role, user.id) }, include: { vehicle: { select: { assignedToId: true } }, fuelLog: { select: { id: true } }, maintenanceRecord: { select: { id: true } } } });
  if (!expense || expense.status !== "POSTED" || !canModifyExpense(membership.role, user.id, expense.createdById, expense.vehicle.assignedToId)) throw new Error("Không thể chỉnh sửa giao dịch này.");
  if (expense.fuelLog) throw new Error("Khoản chi liên kết nhiên liệu được tính theo số lượng và đơn giá; không thể sửa độc lập.");
  if (expense.maintenanceRecord) throw new Error("Khoản chi liên kết bảo dưỡng cần được điều chỉnh từ hồ sơ bảo dưỡng.");
  const parsed = expenseSchema.omit({ idempotencyKey: true }).safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const changed = parsed.data;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: changed.vehicleId, organizationId: organization.id, ...(changed.vehicleId !== expense.vehicleId ? { status: { not: "ARCHIVED" } } : {}), ...vehicleScope(membership.role, user.id) } });
  const category = await prisma.expenseCategory.findFirst({ where: { id: changed.categoryId, organizationId: organization.id, ...(changed.categoryId !== expense.categoryId ? { active: true } : {}) } });
  if (!vehicle || !category) throw new Error("Xe hoặc danh mục không hợp lệ.");
  await prisma.$transaction(async (tx) => {
    const result = await tx.expense.updateMany({ where: { id, organizationId: organization.id, status: "POSTED", ...expenseScope(membership.role, user.id), ...(membership.role === "DRIVER" ? { createdById: user.id } : {}) }, data: { vehicleId: vehicle.id, categoryId: category.id, occurredAt: vnDateToUTC(changed.date), amount: new Prisma.Decimal(changed.amount), odometer: changed.odometer === "" || changed.odometer === undefined ? null : changed.odometer, vendor: changed.vendor, description: changed.description, paymentMethod: changed.paymentMethod } });
    if (result.count !== 1) throw new Error("Quyền truy cập hoặc trạng thái giao dịch đã thay đổi.");
    if (changed.odometer !== "" && changed.odometer !== undefined) await tx.vehicle.updateMany({ where: { id: vehicle.id, organizationId: organization.id, odometer: { lt: changed.odometer } }, data: { odometer: changed.odometer } });
    await tx.auditLog.create({ data: {
      organizationId: organization.id, actorId: user.id, entityType: "Expense", entityId: id,
      action: "UPDATE", before: { amount: expense.amount.toString(), description: expense.description, vehicleId: expense.vehicleId, categoryId: expense.categoryId },
      after: { amount: changed.amount, description: changed.description, vehicleId: vehicle.id, categoryId: category.id, date: changed.date }
    } });
  });
  revalidatePath("/dashboard");
  revalidatePath(`/vehicles/${expense.vehicleId}`);
  revalidatePath(`/vehicles/${vehicle.id}`);
  revalidatePath("/expenses");
  revalidatePath("/reports");
  redirect(`/expenses/${id}`);
}

export async function voidExpense(id: string) {
  const { organization, user, membership } = await requireOrganizationAccess([...writeRoles]);
  const expense = await prisma.expense.findFirst({ where: { id, organizationId: organization.id, ...expenseScope(membership.role, user.id) }, include: { vehicle: { select: { assignedToId: true } }, fuelLog: { select: { id: true } }, maintenanceRecord: { select: { id: true } } } });
  if (!expense || !canModifyExpense(membership.role, user.id, expense.createdById, expense.vehicle.assignedToId)) throw new Error("Không có quyền hủy giao dịch.");
  if (expense.fuelLog || expense.maintenanceRecord) throw new Error("Hãy xóa bản ghi nhiên liệu hoặc bảo dưỡng liên kết để hủy khoản chi này.");
  if (expense.status === "POSTED") await prisma.$transaction(async (tx) => {
    const result = await tx.expense.updateMany({ where: { id, organizationId: organization.id, status: "POSTED", ...expenseScope(membership.role, user.id), ...(membership.role === "DRIVER" ? { createdById: user.id } : {}) }, data: { status: "VOID" } });
    if (result.count !== 1) throw new Error("Quyền truy cập hoặc trạng thái giao dịch đã thay đổi.");
    await tx.auditLog.create({ data: {
      organizationId: organization.id, actorId: user.id, entityType: "Expense", entityId: id,
      action: "VOID", before: { status: "POSTED", amount: expense.amount.toString() }, after: { status: "VOID" }
    } });
  });
  revalidatePath("/dashboard");
  revalidatePath(`/vehicles/${expense.vehicleId}`);
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function addExpenseReceipt(id: string, form: FormData) {
  const { organization, user, membership } = await requireOrganizationAccess([...writeRoles]);
  const expense = await prisma.expense.findFirst({ where: { id, organizationId: organization.id, ...expenseScope(membership.role, user.id) }, include: { vehicle: { select: { assignedToId: true } } } });
  if (!expense || expense.status !== "POSTED" || !canModifyExpense(membership.role, user.id, expense.createdById, expense.vehicle.assignedToId)) throw new Error("Không có quyền thêm chứng từ.");
  const file = await prepareReceipt(form.get("receipt") instanceof File ? form.get("receipt") as File : null);
  if (!file) throw new Error("Vui lòng chọn tệp chứng từ.");
  await writeReceipt(file);
  try {
    await prisma.$transaction(async tx => {
      const current = await tx.expense.findFirst({ where: { id, organizationId: organization.id, status: "POSTED", ...expenseScope(membership.role, user.id) }, include: { vehicle: { select: { assignedToId: true } } } });
      if (!current || !canModifyExpense(membership.role, user.id, current.createdById, current.vehicle.assignedToId)) throw new Error("Giao dịch đã thay đổi.");
      const attachment = await tx.attachment.create({ data: { organizationId: organization.id, expenseId: id, objectKey: file.objectKey, originalName: file.originalName, mimeType: file.mimeType, size: file.size } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "Attachment", entityId: attachment.id, action: "CREATE", after: { expenseId: id, originalName: file.originalName } } });
    });
  } catch (error) { await removeReceipt(file.objectKey); throw error; }
  revalidatePath(`/expenses/${id}`);
  redirect(`/expenses/${id}?files=1`);
}

export async function deleteExpenseReceipt(expenseId: string, attachmentId: string) {
  const { organization, user, membership } = await requireOrganizationAccess([...writeRoles]);
  const attachment = await prisma.attachment.findFirst({ where: { id: attachmentId, expenseId, organizationId: organization.id }, include: { expense: { include: { vehicle: { select: { assignedToId: true } } } } } });
  if (!attachment || attachment.expense.status !== "POSTED" || !canModifyExpense(membership.role, user.id, attachment.expense.createdById, attachment.expense.vehicle.assignedToId)) throw new Error("Không có quyền xóa chứng từ.");
  await prisma.$transaction(async tx => {
    const deleted = await tx.attachment.deleteMany({ where: { id: attachmentId, expenseId, organizationId: organization.id } });
    if (deleted.count !== 1) throw new Error("Chứng từ đã được xóa.");
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "Attachment", entityId: attachmentId, action: "DELETE", before: { expenseId, originalName: attachment.originalName } } });
  });
  await removeReceipt(attachment.objectKey);
  revalidatePath(`/expenses/${expenseId}`);
  redirect(`/expenses/${expenseId}?files=1`);
}
