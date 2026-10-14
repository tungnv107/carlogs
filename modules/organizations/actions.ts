"use server";

import { prisma } from "@/lib/prisma";
import { initialCategories } from "@/lib/categories";
import { requireSession, requireOrganizationAccess } from "@/modules/auth/guards";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createPersonalWorkspace(formData: FormData) {
  const user = await requireSession();
  const name = z.string().trim().min(2).max(100).parse(formData.get("name"));
  // Limit one automatically-created personal space; onboarding is safe to retry.
  const existing = await prisma.organizationMember.findFirst({ where: { userId: user.id, status: "ACTIVE" } });
  if (!existing) {
    await prisma.$transaction(async (tx) => {
      const check = await tx.organizationMember.findFirst({ where: { userId: user.id, status: "ACTIVE" } });
      if (check) return;
      await tx.organization.create({ data: {
        name, createdById: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
        categories: { create: initialCategories.map((category) => ({ ...category })) }
      } });
    });
  }
  redirect("/dashboard");
}

export async function switchOrganization(formData: FormData) {
  const orgId = z.string().min(1).parse(formData.get("organizationId"));
  const { user } = await requireOrganizationAccess();
  const member = await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId: user.id } } });
  if (member?.status !== "ACTIVE") throw new Error("Không có quyền vào không gian này.");
  (await cookies()).set("active-organization", orgId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/dashboard");
}
