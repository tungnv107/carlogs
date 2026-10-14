import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { MemberRole } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "ACTIVE") redirect("/login?error=AccessDenied");
  return user;
}

export async function requireOrganizationAccess(roles?: MemberRole[]) {
  const user = await requireSession();
  const requestedOrg = (await cookies()).get("active-organization")?.value;
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id, status: "ACTIVE" }, include: { organization: true },
    orderBy: { organization: { createdAt: "asc" } }
  });
  if (memberships.length === 0) redirect("/onboarding");
  const membership = memberships.find((entry) => entry.organizationId === requestedOrg) ?? memberships[0];
  if (roles && !roles.includes(membership.role)) throw new Error("Bạn không có quyền thực hiện thao tác này.");
  return { user, membership, organization: membership.organization };
}
