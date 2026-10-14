import Link from "next/link";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { todayVN } from "@/lib/finance";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { ExpenseForm } from "@/components/forms/expense-form";
import { expenseScope, vehicleScope } from "@/lib/access-scope";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewExpense({ searchParams }: { searchParams: Promise<{ vehicleId?: string; created?: string }> }) {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "DRIVER"]);
  const [vehicles, categories, lastExpense] = await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId: organization.id, ...vehicleScope(membership.role, user.id), status: { not: "ARCHIVED" } }, orderBy: { updatedAt: "desc" } }),
    prisma.expenseCategory.findMany({ where: { organizationId: organization.id, active: true }, orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.expense.findFirst({ where: { organizationId: organization.id, createdById: user.id, ...expenseScope(membership.role, user.id) }, select: { vehicleId: true }, orderBy: { createdAt: "desc" } })
  ]);
  const { vehicleId, created } = await searchParams;
  const defaultVehicle = vehicles.some((vehicle) => vehicle.id === vehicleId)
    ? vehicleId
    : vehicles.some((vehicle) => vehicle.id === lastExpense?.vehicleId)
      ? lastExpense?.vehicleId
      : vehicles[0]?.id;
  return <section className="mx-auto max-w-2xl space-y-5"><Link href="/expenses" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">← Lịch sử chi phí</Link><PageHeader eyebrow="GHI NHẬN CHI PHÍ" title="Thêm chi phí" description="Nhập khoản chi mới trong vài thao tác, theo dõi ngay trong sổ chi phí." />
    {created && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">Đã lưu chi phí. Tiếp tục nhập giao dịch mới.</p>}
    {vehicles.length ? <ExpenseForm vehicles={vehicles.map((v) => ({ id: v.id, label: `${v.name} (${v.plate})` }))} categories={categories.map((c) => ({ id: c.id, label: `${c.group} · ${c.name}` }))} date={todayVN()} keyId={randomUUID()} selectedVehicle={defaultVehicle} /> : <div className="card"><h2 className="font-bold">Chưa có xe để ghi chi phí</h2><p className="muted my-3">{membership.role === "DRIVER" ? "Chưa có xe được phân công. Liên hệ người quản lý để được giao xe." : "Bạn cần tạo ít nhất một phương tiện trước."}</p>{["OWNER", "ADMIN", "MANAGER"].includes(membership.role) && <Link className="btn" href="/vehicles/new">Tạo xe</Link>}</div>}
  </section>;
}
