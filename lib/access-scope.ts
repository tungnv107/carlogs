import type { MemberRole, Prisma } from "@prisma/client";

/** A driver sees only vehicles explicitly assigned to that user. */
export function vehicleScope(role: MemberRole, userId: string): Prisma.VehicleWhereInput {
  return role === "DRIVER" ? { assignedToId: userId } : {};
}

export function expenseScope(role: MemberRole, userId: string): Prisma.ExpenseWhereInput {
  return role === "DRIVER" ? { vehicle: { assignedToId: userId } } : {};
}

export function canCreateExpense(role: MemberRole): boolean {
  return role !== "VIEWER";
}

/** Drivers may change only their own transactions on currently assigned vehicles. */
export function canModifyExpense(role: MemberRole, userId: string, createdById: string, assignedToId: string | null): boolean {
  if (role === "DRIVER") return userId === createdById && userId === assignedToId;
  return ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"].includes(role);
}
