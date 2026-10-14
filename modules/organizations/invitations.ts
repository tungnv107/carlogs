"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { invitationToken, invitationTokenHash, normalizedEmail, validInvitationToken, INVITATION_DAYS } from "@/lib/invitations";
import { requireSession, requireOrganizationAccess } from "@/modules/auth/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

type InviteState = { error: string; link: string };
// Limits are checked under a PostgreSQL advisory transaction lock so concurrent
// requests across app instances cannot all pass the same quota check.
const HOURLY_INVITES_PER_USER = 10;
const DAILY_INVITES_PER_ORGANIZATION = 30;
const MAX_PENDING_INVITES = 30;

export async function createInvitation(_previous: InviteState, data: FormData): Promise<InviteState> {
  const { organization, user } = await requireOrganizationAccess(["OWNER", "ADMIN"]);
  const parsed = z.object({
    email: z.string().email().max(254).transform(normalizedEmail),
    role: z.enum(["ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER", "VIEWER"])
  }).safeParse({ email: data.get("email"), role: data.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, link: "" };
  const token = invitationToken();
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${organization.id}))`;
      const now = new Date();
      const [alreadyMember, alreadyInvited, hourly, daily, pending] = await Promise.all([
        tx.organizationMember.findFirst({ where: { organizationId: organization.id, status: "ACTIVE", user: { email: { equals: parsed.data.email, mode: "insensitive" } } } }),
        tx.invitation.findFirst({ where: { organizationId: organization.id, email: parsed.data.email, acceptedAt: null, expiresAt: { gt: now } } }),
        tx.invitation.count({ where: { organizationId: organization.id, createdById: user.id, createdAt: { gte: new Date(now.getTime() - 3_600_000) } } }),
        tx.invitation.count({ where: { organizationId: organization.id, createdAt: { gte: new Date(now.getTime() - 86_400_000) } } }),
        tx.invitation.count({ where: { organizationId: organization.id, acceptedAt: null, expiresAt: { gt: now } } })
      ]);
      if (alreadyMember) return "Tài khoản này đã là thành viên.";
      if (alreadyInvited) return "Email này đã có lời mời còn hiệu lực.";
      if (hourly >= HOURLY_INVITES_PER_USER || daily >= DAILY_INVITES_PER_ORGANIZATION || pending >= MAX_PENDING_INVITES) {
        return "Đã đạt giới hạn lời mời. Vui lòng thử lại sau hoặc chờ các lời mời hiện tại hết hạn.";
      }
      await tx.invitation.create({ data: {
        organizationId: organization.id, createdById: user.id, email: parsed.data.email,
        role: parsed.data.role, tokenHash: invitationTokenHash(token),
        expiresAt: new Date(now.getTime() + INVITATION_DAYS * 86_400_000)
      } });
      return "";
    });
    if (result) return { error: result, link: "" };
  } catch (error) {
    console.error("Failed to create organization invitation", error);
    return { error: "Không tạo được lời mời. Vui lòng thử lại.", link: "" };
  }
  revalidatePath("/settings/members");
  // Return once: only a SHA-256 token digest is persisted in the database.
  return { error: "", link: `/invite/${token}` };
}

export async function acceptInvitation(token: string) {
  const user = await requireSession();
  if (!validInvitationToken(token)) throw new Error("Liên kết mời không hợp lệ.");
  const google = await prisma.account.findFirst({ where: { userId: user.id, provider: "google" } });
  if (!google || !user.email) throw new Error("Vui lòng đăng nhập bằng tài khoản Google được mời.");

  const now = new Date();
  const tokenHash = invitationTokenHash(token);
  await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({ where: { tokenHash } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now || normalizedEmail(user.email!) !== invitation.email) {
      throw new Error("Lời mời đã hết hạn, được sử dụng hoặc không đúng email Google.");
    }
    const existing = await tx.organizationMember.findUnique({ where: {
      organizationId_userId: { organizationId: invitation.organizationId, userId: user.id }
    } });
    if (existing?.status === "SUSPENDED" || existing?.role === "OWNER") {
      throw new Error("Trạng thái thành viên không cho phép chấp nhận lời mời này.");
    }
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
      data: { acceptedAt: now }
    });
    if (claimed.count !== 1) throw new Error("Lời mời đã được sử dụng.");
    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
      create: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role, status: "ACTIVE" },
      update: { role: invitation.role, status: "ACTIVE" }
    });
    await tx.auditLog.create({ data: {
      organizationId: invitation.organizationId, actorId: user.id, entityType: "OrganizationMember",
      entityId: user.id, action: "JOIN", after: { role: invitation.role }
    } });
  });
  (await cookies()).set("active-organization", (await prisma.invitation.findUniqueOrThrow({ where: { tokenHash }, select: { organizationId: true } })).organizationId, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/"
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
