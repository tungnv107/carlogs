import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { CarFront, PlusCircle } from "lucide-react";
import type { VehicleStatus } from "@prisma/client";
import { vehicleScope } from "@/lib/access-scope";
import { formatVND, todayVN, vnDateToUTC } from "@/lib/finance";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowRight, Gauge, Search } from "lucide-react";

export default async function Vehicles({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100).trim();
  const status = (["ACTIVE", "MAINTENANCE", "PAUSED", "ARCHIVED"] as VehicleStatus[]).find((value) => value === params.status);
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page ?? "1", 10) || 1));
  const where = { organizationId: organization.id, ...vehicleScope(membership.role, user.id), ...(status ? { status } : {}), ...(q ? { OR: [
    { name: { contains: q, mode: "insensitive" as const } },
    { plate: { contains: q.toUpperCase(), mode: "insensitive" as const } }
  ] } : {}) };
  const [vehicles, count] = await Promise.all([
    prisma.vehicle.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * 20, take: 20 }),
    prisma.vehicle.count({ where })
  ]);
  const from = vnDateToUTC(todayVN().slice(0, 7) + "-01");
  const vehicleIds = vehicles.map(v => v.id);
  const [costs, upcoming] = await Promise.all([
    prisma.expense.groupBy({ by: ["vehicleId"], where: { organizationId: organization.id, vehicleId: { in: vehicleIds }, status: "POSTED", occurredAt: { gte: from } }, _sum: { amount: true } }),
    prisma.maintenanceSchedule.findMany({ where: { organizationId: organization.id, vehicleId: { in: vehicleIds }, active: true, dueDate: { not: null } }, orderBy: { dueDate: "asc" }, select: { vehicleId: true, title: true, dueDate: true } })
  ]);
  const costByVehicle = new Map(costs.map(row => [row.vehicleId, row._sum.amount?.toString() ?? "0"]));
  const nextDue = new Map<string, { title: string; dueDate: Date | null }>();
  for (const item of upcoming) if (!nextDue.has(item.vehicleId)) nextDue.set(item.vehicleId, item);
  const canEdit = ["OWNER", "ADMIN", "MANAGER"].includes(membership.role);
  return <section className="space-y-5">
    <PageHeader eyebrow="DANH SÁCH PHƯƠNG TIỆN" title="Xe của tôi" description={`${count.toLocaleString("vi-VN")} phương tiện trong phạm vi truy cập`} action={canEdit ? <Link className="btn w-full sm:w-auto" href="/vehicles/new"><PlusCircle size={18}/>Thêm xe</Link> : undefined}/>
    <form className="card flex flex-col gap-3 sm:flex-row sm:items-end" method="get"><label className="flex-1"><span className="label">Tìm phương tiện</span><input name="q" defaultValue={q} placeholder="Tên xe hoặc biển số" aria-label="Tìm xe" /></label><label className="sm:w-52"><span className="label">Trạng thái</span><select name="status" defaultValue={status ?? ""}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang sử dụng</option><option value="MAINTENANCE">Bảo dưỡng</option><option value="PAUSED">Tạm ngừng</option><option value="ARCHIVED">Đã lưu trữ</option></select></label><button className="btn-secondary"><Search size={16}/>Tìm xe</button></form>
    {vehicles.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{vehicles.map((v) => <Link href={`/vehicles/${v.id}`} key={v.id} className="card vehicle-tile group block !p-0">
      {v.imageObjectKey ? <Image unoptimized width={640} height={320} src={`/api/vehicles/${v.id}/image`} alt={`Ảnh ${v.name}`} className="h-40 w-full rounded-t-[21px] object-cover" /> : <div className="vehicle-cover flex h-36 items-center justify-between rounded-t-[21px] px-6"><CarFront size={56} strokeWidth={1.1}/><span className="text-xs font-semibold uppercase tracking-[.18em]">CarLog Fleet</span></div>}
      <div className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-lg font-bold">{v.name}</h2><p className="mt-1 text-sm font-semibold tracking-wide text-[#66758c]">{v.plate}</p></div><span className={`badge shrink-0 ${v.status === "ACTIVE" ? "badge-success" : v.status === "MAINTENANCE" ? "badge-warning" : "badge-neutral"}`}>{v.status === "ACTIVE" ? "Đang dùng" : v.status === "MAINTENANCE" ? "Bảo dưỡng" : v.status === "PAUSED" ? "Tạm ngừng" : "Đã lưu trữ"}</span></div>
        <p className="muted mt-2">{[v.brand, v.model].filter(Boolean).join(" · ") || "Chưa cập nhật dòng xe"}</p><div className="vehicle-metrics mt-4 grid grid-cols-2 gap-3 rounded-xl p-3"><div><p className="stat-label">Chi phí tháng này</p><p className="money mt-1 text-base font-bold text-[var(--brand-deep)]">{formatVND(costByVehicle.get(v.id) ?? "0")}</p></div><div><p className="stat-label flex items-center gap-1"><Gauge size={13}/>Số km</p><p className="money mt-1 text-base font-bold">{v.odometer.toLocaleString("vi-VN")}</p></div></div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--stroke-soft)] pt-3"><p className="muted line-clamp-1">{nextDue.get(v.id) ? `Sắp tới: ${nextDue.get(v.id)?.title}` : "Chưa có lịch bảo dưỡng sắp tới"}</p><ArrowRight size={17} className="shrink-0 text-[var(--brand-deep)] transition-transform group-hover:translate-x-1"/></div>
      </div>
    </Link>)}</div> : <div className="card py-14 text-center"><CarFront className="mx-auto mb-3 text-[#7895bb]" size={40}/><h2 className="text-lg font-semibold">{q || status ? "Không tìm thấy xe" : "Chưa có phương tiện"}</h2><p className="muted mt-2">{q || status ? "Hãy thử từ khóa hoặc bộ lọc khác." : "Tạo xe đầu tiên để bắt đầu ghi nhận chi phí."}</p>{canEdit && <Link href="/vehicles/new" className="btn mt-4">Thêm phương tiện</Link>}</div>}
    <div className="flex justify-between text-sm"><span>{count} phương tiện</span><div className="flex gap-4">{page > 1 && <Link href={`?q=${encodeURIComponent(q)}&status=${status ?? ""}&page=${page-1}`} className="text-blue-600">← Trước</Link>}{page * 20 < count && <Link href={`?q=${encodeURIComponent(q)}&status=${status ?? ""}&page=${page+1}`} className="text-blue-600">Tiếp →</Link>}</div></div>
  </section>;
}
