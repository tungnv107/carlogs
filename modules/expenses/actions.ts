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
  // Update the editable fields; idempotency key is unchanged.
  const amount = form.get("amount");
  const description = form.get("description");
  const changed = expenseSchema.pick({ amount: true, description: true }).parse({ amount, description });
  await prisma.$transaction(async (tx) => {
    const result = await tx.expense.updateMany({ where: { id, organizationId: organization.id, status: "POSTED", ...expenseScope(membership.role, user.id), ...(membership.role === "DRIVER" ? { createdById: user.id } : {}) }, data: { amount: new Prisma.Decimal(changed.amount), description: changed.description } });
    if (result.count !== 1) throw new Error("Quyền truy cập hoặc trạng thái giao dịch đã thay đổi.");
    await tx.auditLog.create({ data: {
      organizationId: organization.id, actorId: user.id, entityType: "Expense", entityId: id,
      action: "UPDATE", before: { amount: expense.amount.toString(), description: expense.description },
      after: { amount: changed.amount, description: changed.description }
    } });
  });
  revalidatePath("/dashboard");
  revalidatePath(`/vehicles/${expense.vehicleId}`);
  revalidatePath("/expenses");
  redirect(`/expenses/${id}`);
}

export async function voidExpense(id: string) {
  const { organization, user, membership } = await requireOrganizationAccess([...writeRoles]);
  const expense = await prisma.expense.findFirst({ where: { id, organizationId: organization.id, ...expenseScope(membership.role, user.id) }, include: { vehicle: { select: { assignedToId: true } } } });
  if (!expense || !canModifyExpense(membership.role, user.id, expense.createdById, expense.vehicle.assignedToId)) throw new Error("Không có quyền hủy giao dịch.");
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
