import { prisma } from "@/lib/prisma";
import { receiptDirectory } from "@/lib/receipts";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expenseScope } from "@/lib/access-scope";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const { id } = await context.params;
  const attachment = await prisma.attachment.findFirst({ where: {
    id, organizationId: organization.id, expense: { organizationId: organization.id, ...expenseScope(membership.role, user.id) }
  } });
  if (!attachment) return new Response("Không tìm thấy tệp.", { status: 404 });
  try {
    const content = await readFile(join(receiptDirectory(), attachment.objectKey));
    return new Response(new Uint8Array(content), { headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": "attachment; filename=receipt",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store"
    } });
  } catch { return new Response("Tệp không tồn tại trên ổ lưu trữ.", { status: 404 }); }
}
