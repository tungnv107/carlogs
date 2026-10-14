import { prisma } from "@/lib/prisma";
import { receiptDirectory } from "@/lib/receipts";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { organization, user, membership } = await requireOrganizationAccess();
  const { id } = await context.params;
  const vehicle = await prisma.vehicle.findFirst({ where: {
    id, organizationId: organization.id,
    ...(membership.role === "DRIVER" ? { assignedToId: user.id } : {})
  }, select: { imageObjectKey: true, imageMimeType: true } });
  if (!vehicle?.imageObjectKey || !vehicle.imageMimeType) return new Response("Không tìm thấy ảnh.", { status: 404 });
  try {
    const contents = await readFile(join(receiptDirectory(), vehicle.imageObjectKey));
    return new Response(new Uint8Array(contents), { headers: {
      "Content-Type": vehicle.imageMimeType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"
    } });
  } catch { return new Response("Ảnh không tồn tại.", { status: 404 }); }
}
