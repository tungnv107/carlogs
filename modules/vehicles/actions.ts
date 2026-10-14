"use server";

import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "./schema";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prepareReceipt, writeReceipt, removeReceipt } from "@/lib/receipts";

function parseVehicle(data: FormData) {
  return vehicleSchema.safeParse({
    plate: data.get("plate"), name: data.get("name"), type: data.get("type"),
    fuelType: data.get("fuelType"), brand: data.get("brand") || undefined,
    model: data.get("model") || undefined, color: data.get("color") || undefined,
    year: data.get("year") || undefined, assignedToId: data.get("assignedToId") || undefined,
    status: data.get("status") || "ACTIVE",
    odometer: data.get("odometer"), notes: data.get("notes") || undefined
  });
}

async function verifyAssignee(organizationId: string, assignedToId?: string) {
  if (!assignedToId) return true;
  const member = await prisma.organizationMember.findUnique({ where: {
    organizationId_userId: { organizationId, userId: assignedToId }
  } });
  return member?.status === "ACTIVE";
}

async function receiveImage(data: FormData) {
  const file = data.get("image");
  const image = await prepareReceipt(file instanceof File ? file : null);
  if (image && !image.mimeType.startsWith("image/")) throw new Error("Ảnh xe phải là JPEG, PNG hoặc WebP.");
  if (image) await writeReceipt(image);
  return image;
}

export async function createVehicle(_prev: { error: string }, data: FormData): Promise<{ error: string }> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const parsed = parseVehicle(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!await verifyAssignee(organization.id, parsed.data.assignedToId)) return { error: "Người phụ trách không thuộc không gian này." };
  let image: Awaited<ReturnType<typeof receiveImage>>;
  try {
    image = await receiveImage(data);
  } catch (error) { return { error: error instanceof Error ? error.message : "Không thể tải ảnh xe." }; }
  try {
    await prisma.$transaction(async tx => {
      const created = await tx.vehicle.create({ data: { ...parsed.data, organizationId: organization.id,
        imageObjectKey: image?.objectKey, imageMimeType: image?.mimeType } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id,
        entityType: "Vehicle", entityId: created.id, action: "CREATE", after: { plate: created.plate } } });
    });
  } catch (error) {
    if (image) await removeReceipt(image.objectKey);
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") return { error: "Biển số đã tồn tại trong không gian này." };
    return { error: "Không lưu được xe. Hãy thử lại." };
  }
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  redirect("/vehicles");
}

export async function updateVehicle(id: string, _prev: { error: string }, data: FormData): Promise<{ error: string }> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  const parsed = parseVehicle(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!await verifyAssignee(organization.id, parsed.data.assignedToId)) return { error: "Người phụ trách không thuộc không gian này." };
  const existing = await prisma.vehicle.findFirst({ where: { id, organizationId: organization.id } });
  if (!existing) return { error: "Không tìm thấy xe trong không gian hiện tại." };
  if (parsed.data.odometer < existing.odometer) return {
    error: "Số km mới thấp hơn số km hiện tại. Việc điều chỉnh giảm cần quy trình hiệu chỉnh có ghi lý do."
  };
  let image: Awaited<ReturnType<typeof receiveImage>>;
  try { image = await receiveImage(data); } catch (error) { return { error: error instanceof Error ? error.message : "Không thể tải ảnh xe." }; }
  try {
    await prisma.$transaction(async tx => {
      const changed = await tx.vehicle.updateMany({
        where: { id: existing.id, organizationId: organization.id, odometer: { lte: parsed.data.odometer } },
        data: {
        ...parsed.data, ...(image ? { imageObjectKey: image.objectKey, imageMimeType: image.mimeType } : {})
      } });
      if (changed.count !== 1) throw new Error("Số km vừa được người khác cập nhật.");
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id,
        entityType: "Vehicle", entityId: id, action: "UPDATE",
        before: { plate: existing.plate, status: existing.status, assignedToId: existing.assignedToId },
        after: { plate: parsed.data.plate, status: parsed.data.status, assignedToId: parsed.data.assignedToId ?? null } } });
    });
  } catch (error) {
    if (image) await removeReceipt(image.objectKey);
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") return { error: "Biển số đã tồn tại." };
    if (error instanceof Error && error.message === "Số km vừa được người khác cập nhật.") return { error: error.message + " Tải lại trang và thử lại." };
    return { error: "Không thể cập nhật xe." };
  }
  if (image && existing.imageObjectKey) await removeReceipt(existing.imageObjectKey);
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  redirect(`/vehicles/${id}`);
}

export async function archiveVehicle(id: string) {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER"]);
  await prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findFirst({
      where: { id, organizationId: organization.id },
      select: { id: true, plate: true, status: true }
    });
    if (!existing) throw new Error("Không tìm thấy xe trong không gian hiện tại.");
    if (existing.status === "ARCHIVED") return;
    const result = await tx.vehicle.updateMany({
      where: { id, organizationId: organization.id, status: existing.status },
      data: { status: "ARCHIVED" }
    });
    if (result.count !== 1) throw new Error("Trạng thái xe vừa thay đổi. Vui lòng thử lại.");
    await tx.auditLog.create({ data: {
      organizationId: organization.id, actorId: user.id,
      entityType: "Vehicle", entityId: id, action: "ARCHIVE",
      before: { status: existing.status, plate: existing.plate },
      after: { status: "ARCHIVED", plate: existing.plate }
    } });
  });
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${id}`);
  revalidatePath("/dashboard");
  redirect("/vehicles");
}
