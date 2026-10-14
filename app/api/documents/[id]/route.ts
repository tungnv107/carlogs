import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { receiptDirectory } from "@/lib/receipts";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const { id } = await params;
  const document = await prisma.vehicleDocument.findFirst({ where: { id, organizationId: organization.id, vehicle: { organizationId: organization.id, ...vehicleScope(membership.role, user.id) } } });
  if (!document?.objectKey || !document.mimeType) return new Response("Không có tệp phù hợp.", { status: 404 });
  try {
    const data = await readFile(join(receiptDirectory(), document.objectKey));
    return new Response(new Uint8Array(data), { headers: { "Content-Type": document.mimeType, "Content-Disposition": "attachment; filename=document", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch { return new Response("Tệp không tồn tại.", { status: 404 }); }
}
