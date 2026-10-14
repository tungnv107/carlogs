import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatVND, vnDateToUTC, dateSchema } from "@/lib/finance";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { canCreateExpense, expenseScope, vehicleScope } from "@/lib/access-scope";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { Plus, ReceiptText, ArrowRight } from "lucide-react";

export default async function Expenses({ searchParams }: { searchParams: Promise<{ vehicleId?: string; categoryId?: string; createdById?: string; q?: string; from?: string; to?: string; page?: string; created?: string }> }) {
  const { organization, user, membership } = await requireOrganizationAccess();
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page ?? "1", 10) || 1));
  const from = params.from && dateSchema.safeParse(params.from).success ? vnDateToUTC(params.from) : undefined;
  const to = params.to && dateSchema.safeParse(params.to).success ? new Date(vnDateToUTC(params.to).getTime() + 86400000) : undefined;
  const q = (params.q ?? "").slice(0, 100);
  const [vehicles, categories, members] = await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId: organization.id, ...vehicleScope(membership.role, user.id) }, select: { id: true, name: true, plate: true } }),
    prisma.expenseCategory.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true, group: true }, orderBy: { name: "asc" } }),
    prisma.organizationMember.findMany({ where: { organizationId: organization.id, ...(membership.role === "DRIVER" ? { userId: user.id } : {}) }, select: { userId: true, user: { select: { name: true, email: true } } } })
  ]);
  const selectedVehicle = vehicles.some((v) => v.id === params.vehicleId) ? params.vehicleId : undefined;
  const selectedCategory = categories.some((category) => category.id === params.categoryId) ? params.categoryId : undefined;
  const selectedCreator = members.some((member) => member.userId === params.createdById) ? params.createdById : undefined;
  const where = {
    organizationId: organization.id,
    ...expenseScope(membership.role, user.id),
    ...(selectedVehicle ? { vehicleId: selectedVehicle } : {}),
    ...(selectedCategory ? { categoryId: selectedCategory } : {}),
    ...(selectedCreator ? { createdById: selectedCreator } : {}),
    ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q ? { OR: [{ description: { contains: q, mode: "insensitive" as const } }, { vendor: { contains: q, mode: "insensitive" as const } }] } : {})
  };
  const [expenses, count, sum] = await Promise.all([
    prisma.expense.findMany({ where, include: { vehicle: true, category: true }, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], skip: (page - 1) * 20, take: 20 }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where: { ...where, status: "POSTED" }, _sum: { amount: true } })
  ]);
  const filter = new URLSearchParams({ ...(selectedVehicle ? { vehicleId: selectedVehicle } : {}), ...(selectedCategory ? { categoryId: selectedCategory } : {}), ...(selectedCreator ? { createdById: selectedCreator } : {}), ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}), ...(q ? { q } : {}) });
  return <section className="space-y-5">
    <PageHeader eyebrow="SỔ GIAO DỊCH" title="Lịch sử chi phí" description="Theo dõi và tra cứu mọi khoản chi theo xe, ngày và danh mục." action={canCreateExpense(membership.role) ? <Link href="/expenses/new" className="btn w-full sm:w-auto"><Plus size={18}/>Thêm chi phí</Link> : undefined}/>
    {params.created && <p className="rounded-xl bg-green-50 p-3 text-green-800" role="status">Đã lưu chi phí thành công.</p>}
    <FilterDrawer title="Bộ lọc giao dịch" resetHref="/expenses"><form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label><span className="label">Xe</span><select name="vehicleId" defaultValue={selectedVehicle ?? ""}><option value="">Tất cả xe</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.name}</option>)}</select></label>
      <label><span className="label">Danh mục</span><select name="categoryId" defaultValue={selectedCategory ?? ""}><option value="">Tất cả danh mục</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.group} · {c.name}</option>)}</select></label>
      <label><span className="label">Người nhập</span><select name="createdById" defaultValue={selectedCreator ?? ""}><option value="">Tất cả người nhập</option>{members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name ?? m.user.email ?? m.userId}</option>)}</select></label>
      <label><span className="label">Từ ngày</span><input type="date" name="from" defaultValue={params.from ?? ""}/></label>
      <label><span className="label">Đến ngày</span><input type="date" name="to" defaultValue={params.to ?? ""}/></label>
      <label><span className="label">Tìm nội dung</span><input name="q" defaultValue={q} placeholder="Ghi chú/đơn vị" /></label>
      <div className="flex items-end gap-2"><button className="btn flex-1">Áp dụng bộ lọc</button><Link href="/expenses" className="btn-secondary">Xóa lọc</Link></div>
    </form></FilterDrawer>
    <div className="card ledger-summary flex flex-wrap items-center justify-between gap-4"><div><p className="stat-label">Tổng chi phí hợp lệ</p><p className="money mt-2 text-2xl font-extrabold text-[var(--ink)]">{formatVND(sum._sum.amount?.toString() ?? "0")}</p></div><div className="text-right"><p className="stat-label">Giao dịch phù hợp</p><p className="mt-1 text-xl font-bold">{count.toLocaleString("vi-VN")}</p><p className="muted">Bao gồm giao dịch đã hủy</p></div></div>
    {expenses.length ? <section className="card transaction-list !p-0"><div className="flex items-center justify-between border-b border-[var(--stroke-soft)] px-4 py-4 sm:px-5"><h2 className="section-title">Giao dịch</h2><span className="muted">Trang {page}</span></div><div className="divider-list px-4 sm:px-5">{expenses.map((e) => <Link key={e.id} href={`/expenses/${e.id}`} className="transaction-row group flex items-center gap-3 py-4"><span className="transaction-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl"><ReceiptText size={19}/></span><div className="min-w-0 flex-1"><p className="truncate font-bold">{e.category.name} {e.status === "VOID" && <span className="badge badge-danger ml-1">Đã hủy</span>}</p><p className="muted truncate">{e.vehicle.plate} · {e.vehicle.name}</p><p className="muted">{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short" }).format(e.occurredAt)}</p></div><strong className="money max-w-[42%] text-right text-sm sm:text-base">{formatVND(e.amount.toString())}</strong><ArrowRight size={16} className="hidden shrink-0 text-[var(--muted)] sm:block"/></Link>)}</div></section> : <div className="card py-12 text-center"><ReceiptText className="mx-auto mb-3 text-[var(--brand-primary)]" size={38}/><h2 className="font-semibold">Chưa có giao dịch phù hợp</h2><p className="muted mt-2">Thử thay đổi bộ lọc hoặc ghi nhận chi phí mới.</p>{canCreateExpense(membership.role) && <Link href="/expenses/new" className="btn-secondary mt-4">Thêm chi phí</Link>}</div>}
    <div className="flex justify-between">{page > 1 ? <Link href={`?${filter.toString()}&page=${page-1}`} className="text-blue-600">← Trước</Link> : <span/>}{count > page * 20 && <Link href={`?${filter.toString()}&page=${page+1}`} className="text-blue-600">Tiếp →</Link>}</div>
  </section>;
}
