"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { amountSchema, dateSchema, todayVN } from "@/lib/finance";
import { reminderStatus } from "@/lib/reminder-rules";
import { vnLocalDateTime } from "@/lib/operations-rules";
import { sameMaintenanceSubmission } from "@/lib/linked-idempotency";
import { eligibleMaintenanceWork } from "@/lib/maintenance-completion";
import { prepareReceipt, writeReceipt, removeReceipt } from "@/lib/receipts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = { error: string };
const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  kind: z.enum(["MAINTENANCE", "REPAIR"]),
  occurredAt: z.string().refine(value => { try { vnLocalDateTime(value); return true; } catch { return false; } }, "Ngày giờ không hợp lệ."),
  odometer: z.coerce.number().int().min(0).max(1_000_000_000),
  description: z.string().trim().min(3).max(2000),
  vendor: z.string().trim().max(150),
  amount: z.union([z.literal("0"), amountSchema]),
  idempotencyKey: z.string().uuid()
});

export async function createMaintenance(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"]);
  const parsed = maintenanceSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const entry = parsed.data;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: entry.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" }, ...vehicleScope(membership.role, user.id) } });
  if (!vehicle) return { error: "Xe không hợp lệ." };
  const occurredAt = vnLocalDateTime(entry.occurredAt);
  const incoming = { createdById: user.id, vehicleId: vehicle.id, kind: entry.kind, occurredAt, odometer: entry.odometer, description: entry.description, vendor: entry.vendor, amount: new Prisma.Decimal(entry.amount) };
  try {
    await prisma.$transaction(async tx => {
      const existing = await tx.maintenanceRecord.findUnique({ where: { organizationId_idempotencyKey: { organizationId: organization.id, idempotencyKey: entry.idempotencyKey } }, include: { expense: true } });
      if (existing) {
        if (!sameMaintenanceSubmission(existing, incoming)) throw new Error("Mã lưu đã được sử dụng cho nội dung khác.");
        return;
      }
      let expenseId: string | undefined;
      if (entry.amount !== "0") {
        const name = entry.kind === "REPAIR" ? "Sửa chữa" : "Bảo dưỡng định kỳ";
        const category = await tx.expenseCategory.findFirst({ where: { organizationId: organization.id, name, active: true } });
        if (!category) throw new Error(`Thiếu danh mục ${name}.`);
        const expense = await tx.expense.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, categoryId: category.id, occurredAt, amount: new Prisma.Decimal(entry.amount), odometer: entry.odometer, vendor: entry.vendor, description: entry.description, createdById: user.id, idempotencyKey: entry.idempotencyKey } });
        expenseId = expense.id;
      }
      const record = await tx.maintenanceRecord.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, expenseId, occurredAt, odometer: entry.odometer, kind: entry.kind, description: entry.description, vendor: entry.vendor, createdById: user.id, idempotencyKey: entry.idempotencyKey } });
      await tx.vehicle.updateMany({ where: { id: vehicle.id, organizationId: organization.id, odometer: { lt: entry.odometer } }, data: { odometer: entry.odometer } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "MaintenanceRecord", entityId: record.id, action: "CREATE", after: { ...entry, expenseId } } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.maintenanceRecord.findUnique({ where: { organizationId_idempotencyKey: { organizationId: organization.id, idempotencyKey: entry.idempotencyKey } }, include: { expense: true } });
      if (!existing || !sameMaintenanceSubmission(existing, incoming)) return { error: "Mã lưu đã được sử dụng cho nội dung khác." };
    } else return { error: error instanceof Error && /^(Mã lưu|Thiếu danh mục)/.test(error.message) ? error.message : "Không lưu được bảo dưỡng; vui lòng kiểm tra và thử lại." };
  }
  revalidatePath("/maintenance"); revalidatePath("/dashboard"); revalidatePath("/expenses");
  redirect("/maintenance?created=1");
}

const scheduleSchema = z.object({
  vehicleId: z.string().min(1), title: z.string().trim().min(3).max(150),
  dueDate: z.union([z.literal(""), dateSchema]),
  dueOdometer: z.union([z.literal(""), z.coerce.number().int().min(0).max(1_000_000_000)]),
  warningDays: z.coerce.number().int().min(0).max(3650), warningKm: z.coerce.number().int().min(0).max(100_000)
}).refine(value => value.dueDate !== "" || value.dueOdometer !== "", "Cần ít nhất một hạn theo ngày hoặc km.");

export async function createSchedule(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const parsed = scheduleSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: v.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" } } });
  if (!vehicle) return { error: "Không tìm thấy xe." };
  await prisma.$transaction(async tx => {
    const schedule = await tx.maintenanceSchedule.create({ data: { organizationId: organization.id, vehicleId: v.vehicleId, title: v.title, dueDate: v.dueDate ? new Date(`${v.dueDate}T00:00:00Z`) : null, dueOdometer: v.dueOdometer === "" ? null : v.dueOdometer, warningDays: v.warningDays, warningKm: v.warningKm } });
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "MaintenanceSchedule", entityId: schedule.id, action: "CREATE" } });
  });
  revalidatePath("/maintenance"); redirect("/maintenance?scheduled=1");
}

export async function completeSchedule(id: string, form: FormData) {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const selectedId = form.get("maintenanceRecordId");
  if (typeof selectedId !== "string" || !selectedId.trim()) throw new Error("Cần chọn công việc đã thực hiện.");
  await prisma.$transaction(async tx => {
    const schedule = await tx.maintenanceSchedule.findFirst({ where: { id, organizationId: organization.id, active: true } });
    if (!schedule) throw new Error("Lịch không tồn tại hoặc đã hoàn thành.");
    const completedWork = await tx.maintenanceRecord.findFirst({ where: { id: selectedId, vehicleId: schedule.vehicleId, organizationId: organization.id, occurredAt: { gte: schedule.createdAt } } });
    if (!completedWork || !eligibleMaintenanceWork(schedule, completedWork, selectedId)) throw new Error("Công việc đã chọn không phù hợp với lịch hoặc quyền truy cập.");
    const updated = await tx.maintenanceSchedule.updateMany({ where: { id, organizationId: organization.id, active: true }, data: { active: false, completedAt: new Date() } });
    if (updated.count !== 1) throw new Error("Lịch đã hoàn thành hoặc không có quyền truy cập.");
    await tx.reminder.updateMany({ where: { organizationId: organization.id, sourceKey: `schedule:${id}` }, data: { status: "RESOLVED" } });
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "MaintenanceSchedule", entityId: id, action: "COMPLETE", after: { maintenanceRecordId: completedWork.id, workOccurredAt: completedWork.occurredAt.toISOString() } } });
  });
  revalidatePath("/maintenance"); revalidatePath("/dashboard");
  redirect("/maintenance?completed=1");
}

export async function resolveDocumentReminder(id: string) {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  await prisma.$transaction(async tx => {
    const reminder = await tx.reminder.findFirst({ where: { id, organizationId: organization.id, sourceKey: { startsWith: "document:" }, status: { not: "RESOLVED" } } });
    if (!reminder) throw new Error("Thông báo không còn hiệu lực.");
    const sourceId = reminder.sourceKey.split(":")[1];
    const previous = await tx.vehicleDocument.findFirst({ where: { id: sourceId, organizationId: organization.id } });
    if (!previous?.expiresAt) throw new Error("Không tìm thấy giấy tờ trước đó.");
    const replacement = await tx.vehicleDocument.findFirst({ where: { organizationId: organization.id, vehicleId: previous.vehicleId, kind: previous.kind, expiresAt: { gt: previous.expiresAt } } });
    if (!replacement) throw new Error("Cần bổ sung giấy tờ mới với hạn sử dụng dài hơn trước khi đóng cảnh báo.");
    await tx.reminder.update({ where: { id }, data: { status: "RESOLVED" } });
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "Reminder", entityId: id, action: "RESOLVE", after: { replacementDocumentId: replacement.id } } });
  });
  revalidatePath("/notifications"); revalidatePath("/dashboard");
}

const documentSchema = z.object({
  vehicleId: z.string().min(1), kind: z.string().trim().min(2).max(100),
  documentNumber: z.string().trim().max(100), effectiveAt: z.union([z.literal(""), dateSchema]), expiresAt: z.union([z.literal(""), dateSchema])
}).refine(value => !value.effectiveAt || !value.expiresAt || value.effectiveAt <= value.expiresAt, "Ngày hết hạn phải sau ngày hiệu lực.");

export async function createDocument(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const parsed = documentSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const vehicle = await prisma.vehicle.findFirst({ where: { id: v.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" } } });
  if (!vehicle) return { error: "Không tìm thấy xe." };
  let file: Awaited<ReturnType<typeof prepareReceipt>> = null;
  try {
    file = await prepareReceipt(form.get("document") instanceof File ? form.get("document") as File : null);
    if (file) await writeReceipt(file);
    await prisma.$transaction(async tx => {
      const record = await tx.vehicleDocument.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, kind: v.kind, documentNumber: v.documentNumber, effectiveAt: v.effectiveAt ? new Date(`${v.effectiveAt}T00:00:00Z`) : null, expiresAt: v.expiresAt ? new Date(`${v.expiresAt}T00:00:00Z`) : null, objectKey: file?.objectKey, originalName: file?.originalName, mimeType: file?.mimeType } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "VehicleDocument", entityId: record.id, action: "CREATE", after: { vehicleId: v.vehicleId, kind: v.kind } } });
    });
  } catch (error) {
    if (file) await removeReceipt(file.objectKey);
    if (error instanceof Error && /^(Ảnh hóa đơn vượt quá|Chỉ hỗ trợ JPEG|Tệp không đúng định dạng|Tệp PDF không hợp lệ|Tệp chứa nội dung PDF không an toàn|Ảnh không hợp lệ|Ảnh vượt quá)/.test(error.message)) {
      return { error: error.message };
    }
    console.error("Failed to create vehicle document", error);
    return { error: "Không lưu được giấy tờ. Vui lòng thử lại." };
  }
  revalidatePath("/maintenance"); redirect("/maintenance?document=1");
}

function refreshMaintenanceViews(vehicleId: string) {
  for (const path of ["/maintenance", "/notifications", "/expenses", "/dashboard", "/reports", `/vehicles/${vehicleId}`]) revalidatePath(path);
}

export async function updateMaintenance(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"]);
  const parsed = maintenanceSchema.omit({ idempotencyKey: true }).safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const entry = parsed.data;
  const existing = await prisma.maintenanceRecord.findFirst({ where: { id, organizationId: organization.id }, include: { expense: true } });
  const vehicle = await prisma.vehicle.findFirst({ where: { id: entry.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" } } });
  if (!existing || !vehicle || existing.vehicleId !== vehicle.id) return { error: "Hồ sơ hoặc xe không hợp lệ." };
  try {
    await prisma.$transaction(async tx => {
      const amount = new Prisma.Decimal(entry.amount);
      const categoryName = entry.kind === "REPAIR" ? "Sửa chữa" : "Bảo dưỡng định kỳ";
      const category = amount.gt(0) ? await tx.expenseCategory.findFirst({ where: { organizationId: organization.id, name: categoryName, active: true } }) : null;
      if (amount.gt(0) && !category) throw new Error(`Thiếu danh mục ${categoryName}.`);
      const occurredAt = vnLocalDateTime(entry.occurredAt);
      let expenseId = existing.expenseId;
      if (existing.expense) {
        await tx.expense.update({ where: { id: existing.expense.id }, data: { occurredAt, amount: amount.gt(0) ? amount : existing.expense.amount, status: amount.gt(0) ? "POSTED" : "VOID", odometer: entry.odometer, vendor: entry.vendor, description: entry.description, ...(category ? { categoryId: category.id } : {}) } });
      } else if (amount.gt(0) && category) {
        const expense = await tx.expense.create({ data: { organizationId: organization.id, vehicleId: vehicle.id, categoryId: category.id, occurredAt, amount, odometer: entry.odometer, vendor: entry.vendor, description: entry.description, createdById: user.id, idempotencyKey: existing.idempotencyKey } });
        expenseId = expense.id;
      }
      await tx.maintenanceRecord.update({ where: { id }, data: { kind: entry.kind, occurredAt, odometer: entry.odometer, description: entry.description, vendor: entry.vendor, expenseId } });
      await tx.vehicle.updateMany({ where: { id: vehicle.id, organizationId: organization.id, odometer: { lt: entry.odometer } }, data: { odometer: entry.odometer } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "MaintenanceRecord", entityId: id, action: "UPDATE", before: { kind: existing.kind, description: existing.description, amount: existing.expense?.status === "POSTED" ? existing.expense.amount.toString() : "0" }, after: { kind: entry.kind, description: entry.description, amount: entry.amount } } });
    });
  } catch (error) { return { error: error instanceof Error && error.message.startsWith("Thiếu danh mục") ? error.message : "Không cập nhật được hồ sơ bảo dưỡng." }; }
  refreshMaintenanceViews(vehicle.id);
  redirect("/maintenance?updated=1");
}

export async function deleteMaintenance(id: string) {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"]);
  const record = await prisma.maintenanceRecord.findFirst({ where: { id, organizationId: organization.id }, include: { expense: true } });
  if (!record) throw new Error("Không tìm thấy hồ sơ bảo dưỡng.");
  await prisma.$transaction(async tx => {
    if (record.expenseId) await tx.expense.update({ where: { id: record.expenseId }, data: { status: "VOID" } });
    await tx.maintenanceRecord.delete({ where: { id } });
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "MaintenanceRecord", entityId: id, action: "DELETE", before: { vehicleId: record.vehicleId, description: record.description, expenseId: record.expenseId } } });
  });
  refreshMaintenanceViews(record.vehicleId);
  redirect("/maintenance?deleted=1");
}

export async function updateSchedule(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const parsed = scheduleSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const entry = parsed.data;
  const existing = await prisma.maintenanceSchedule.findFirst({ where: { id, organizationId: organization.id, active: true } });
  const vehicle = await prisma.vehicle.findFirst({ where: { id: entry.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" } } });
  if (!existing || !vehicle || existing.vehicleId !== vehicle.id) return { error: "Lịch đã hoàn thành hoặc xe không hợp lệ." };
  const dueDate = entry.dueDate ? new Date(`${entry.dueDate}T00:00:00Z`) : null;
  const dueOdometer = entry.dueOdometer === "" ? null : entry.dueOdometer;
  const status = reminderStatus({ today: todayVN(), dueDate: entry.dueDate || null, dueOdometer, currentOdometer: vehicle.odometer, warningDays: entry.warningDays, warningKm: entry.warningKm });
  await prisma.$transaction(async tx => {
    await tx.maintenanceSchedule.update({ where: { id }, data: { title: entry.title, dueDate, dueOdometer, warningDays: entry.warningDays, warningKm: entry.warningKm } });
    if (status) {
      await tx.reminder.upsert({ where: { organizationId_sourceKey: { organizationId: organization.id, sourceKey: `schedule:${id}` } }, create: { organizationId: organization.id, vehicleId: vehicle.id, sourceKey: `schedule:${id}`, title: entry.title, status, dueDate, dueOdometer }, update: { status, title: entry.title, dueDate, dueOdometer } });
    } else {
      await tx.reminder.updateMany({ where: { organizationId: organization.id, sourceKey: `schedule:${id}` }, data: { status: "RESOLVED", title: entry.title, dueDate, dueOdometer } });
    }
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "MaintenanceSchedule", entityId: id, action: "UPDATE", before: { title: existing.title }, after: { title: entry.title, dueDate: entry.dueDate, dueOdometer: entry.dueOdometer } } });
  });
  refreshMaintenanceViews(vehicle.id);
  redirect("/maintenance?updated=1");
}

export async function deleteSchedule(id: string) {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const existing = await prisma.maintenanceSchedule.findFirst({ where: { id, organizationId: organization.id } });
  if (!existing) throw new Error("Không tìm thấy lịch nhắc.");
  await prisma.$transaction(async tx => {
    await tx.reminder.deleteMany({ where: { organizationId: organization.id, sourceKey: `schedule:${id}` } });
    await tx.maintenanceSchedule.delete({ where: { id } });
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "MaintenanceSchedule", entityId: id, action: "DELETE", before: { title: existing.title, vehicleId: existing.vehicleId } } });
  });
  refreshMaintenanceViews(existing.vehicleId);
  redirect("/maintenance?deleted=1");
}

export async function updateDocument(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const parsed = documentSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const entry = parsed.data;
  const existing = await prisma.vehicleDocument.findFirst({ where: { id, organizationId: organization.id } });
  const vehicle = await prisma.vehicle.findFirst({ where: { id: entry.vehicleId, organizationId: organization.id, status: { not: "ARCHIVED" } } });
  if (!existing || !vehicle || existing.vehicleId !== vehicle.id) return { error: "Giấy tờ hoặc xe không hợp lệ." };
  const removeCurrentFile = form.get("removeCurrentFile") === "on";
  const expiryChanged = (existing.expiresAt?.toISOString().slice(0, 10) ?? "") !== entry.expiresAt;
  let file: Awaited<ReturnType<typeof prepareReceipt>> = null;
  try {
    file = await prepareReceipt(form.get("document") instanceof File ? form.get("document") as File : null);
    if (file) await writeReceipt(file);
    await prisma.$transaction(async tx => {
      await tx.vehicleDocument.update({ where: { id }, data: { kind: entry.kind, documentNumber: entry.documentNumber, effectiveAt: entry.effectiveAt ? new Date(`${entry.effectiveAt}T00:00:00Z`) : null, expiresAt: entry.expiresAt ? new Date(`${entry.expiresAt}T00:00:00Z`) : null, ...(file ? { objectKey: file.objectKey, originalName: file.originalName, mimeType: file.mimeType } : removeCurrentFile ? { objectKey: null, originalName: null, mimeType: null } : {}) } });
      if (expiryChanged) {
        await tx.reminder.updateMany({ where: { organizationId: organization.id, sourceKey: { startsWith: `document:${id}:` } }, data: { status: "RESOLVED" } });
      } else if (entry.expiresAt) {
        await tx.reminder.updateMany({ where: { organizationId: organization.id, sourceKey: `document:${id}:${entry.expiresAt}` }, data: { title: `${entry.kind} · ${entry.documentNumber || "Giấy tờ"}` } });
      }
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "VehicleDocument", entityId: id, action: "UPDATE", before: { kind: existing.kind, expiresAt: existing.expiresAt?.toISOString() }, after: { kind: entry.kind, expiresAt: entry.expiresAt } } });
    });
  } catch (error) {
    if (file) await removeReceipt(file.objectKey);
    return { error: error instanceof Error && /^(Ảnh|Chỉ hỗ trợ|Tệp)/.test(error.message) ? error.message : "Không cập nhật được giấy tờ." };
  }
  if ((file || removeCurrentFile) && existing.objectKey) await removeReceipt(existing.objectKey);
  refreshMaintenanceViews(vehicle.id);
  redirect("/maintenance?updated=1");
}

export async function deleteDocument(id: string) {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const existing = await prisma.vehicleDocument.findFirst({ where: { id, organizationId: organization.id } });
  if (!existing) throw new Error("Không tìm thấy giấy tờ.");
  await prisma.$transaction(async tx => {
    await tx.reminder.deleteMany({ where: { organizationId: organization.id, sourceKey: { startsWith: `document:${id}:` } } });
    await tx.vehicleDocument.delete({ where: { id } });
    await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, entityType: "VehicleDocument", entityId: id, action: "DELETE", before: { vehicleId: existing.vehicleId, kind: existing.kind, documentNumber: existing.documentNumber } } });
  });
  if (existing.objectKey) await removeReceipt(existing.objectKey);
  refreshMaintenanceViews(existing.vehicleId);
  redirect("/maintenance?deleted=1");
}
