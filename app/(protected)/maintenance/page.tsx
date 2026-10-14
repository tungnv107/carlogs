import Link from "next/link";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { formatVND, dateSchema, vnDateToUTC } from "@/lib/finance";
import { boundedReportPage } from "@/lib/report-period";
import { MaintenanceForm, ScheduleForm, DocumentForm } from "@/components/forms/maintenance-forms";
import { PageHeader } from "@/components/ui/page-header";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { CalendarClock, ClipboardList, FileText, Wrench } from "lucide-react";

export default async function Maintenance({ searchParams }: { searchParams: Promise<{ vehicleId?: string; page?: string; from?: string; to?: string; created?: string; scheduled?: string; document?: string; completed?: string }> }) {
  const { organization, user, membership } = await requireOrganizationAccess();
  const params = await searchParams;
  const vehicles = await prisma.vehicle.findMany({ where: { organizationId: organization.id, ...vehicleScope(membership.role, user.id) }, select: { id: true, plate: true, name: true }, orderBy: { plate: "asc" } });
  const selectedVehicle = vehicles.some(v => v.id === params.vehicleId) ? params.vehicleId : undefined;
  const from = params.from && dateSchema.safeParse(params.from).success ? vnDateToUTC(params.from) : undefined;
  const to = params.to && dateSchema.safeParse(params.to).success ? new Date(vnDateToUTC(params.to).getTime() + 86400000) : undefined;
  const where = { organizationId: organization.id, vehicle: vehicleScope(membership.role, user.id), ...(selectedVehicle ? { vehicleId: selectedVehicle } : {}), ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}) };
  const [count, schedules, documents] = await Promise.all([
    prisma.maintenanceRecord.count({ where }),
    prisma.maintenanceSchedule.findMany({ where: { organizationId: organization.id, vehicle: vehicleScope(membership.role, user.id), ...(selectedVehicle ? { vehicleId: selectedVehicle } : {}) }, include: { vehicle: true }, orderBy: [{ active: "desc" }, { dueDate: "asc" }], take: 40 }),
    prisma.vehicleDocument.findMany({ where: { organizationId: organization.id, vehicle: vehicleScope(membership.role, user.id), ...(selectedVehicle ? { vehicleId: selectedVehicle } : {}) }, include: { vehicle: true }, orderBy: { createdAt: "desc" }, take: 40 })
  ]);
  const page = boundedReportPage(params.page, count, 15);
  const records = await prisma.maintenanceRecord.findMany({ where, include: { vehicle: true, expense: true }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: 15, skip: (page - 1) * 15 });
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(membership.role);
  const canRecord = canManage || membership.role === "ACCOUNTANT";
  const options = vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.name}` }));
  const time = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).replace(" ", "T");
  const query = new URLSearchParams({ ...(selectedVehicle ? { vehicleId: selectedVehicle } : {}), ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}) });
  return <section className="space-y-6">
    <PageHeader eyebrow="VẬN HÀNH PHƯƠNG TIỆN" title="Bảo dưỡng & giấy tờ" description="Lên lịch, theo dõi hạn và lưu trữ hồ sơ bảo dưỡng, giấy tờ từng xe." action={<Link href="/notifications" className="btn-secondary w-full sm:w-auto"><CalendarClock size={17}/>Trung tâm nhắc hạn</Link>}/>
    {(params.created || params.scheduled || params.document || params.completed) && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">Đã lưu thành công.</p>}
    <FilterDrawer title="Lọc phương tiện & thời gian" resetHref="/maintenance"><form method="get" className="grid gap-3 sm:grid-cols-4"><label><span className="label">Xe</span><select name="vehicleId" defaultValue={selectedVehicle ?? ""}><option value="">Tất cả xe</option>{options.map(v => <option value={v.id} key={v.id}>{v.label}</option>)}</select></label><label><span className="label">Từ ngày</span><input type="date" name="from" defaultValue={params.from ?? ""}/></label><label><span className="label">Đến ngày</span><input type="date" name="to" defaultValue={params.to ?? ""}/></label><button className="btn mt-auto">Lọc lịch sử</button></form></FilterDrawer>
    {options.length > 0 && (canRecord || canManage) && <details className="insight-band group"><summary className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold text-[var(--brand-deep)]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-solid)]"><Wrench size={19}/></span><span className="flex-1">Thêm công việc, lịch nhắc hoặc giấy tờ</span><span className="text-xs text-[var(--text-secondary)] group-open:hidden">Mở ↓</span></summary><div className="mt-4 grid items-start gap-4 lg:grid-cols-2">{canRecord && <MaintenanceForm vehicles={options} selectedVehicle={selectedVehicle} initialTime={time} keyId={randomUUID()}/ >}{canManage && <ScheduleForm vehicles={options} selectedVehicle={selectedVehicle}/>}{canManage && <DocumentForm vehicles={options} selectedVehicle={selectedVehicle}/>}</div></details>}
    <section className="card"><h2 className="section-title flex items-center gap-2"><CalendarClock size={19} className="text-[#153c88]"/>Lịch nhắc bảo dưỡng ({schedules.length})</h2>{schedules.length ? <div className="divider-list mt-3">{schedules.map(s => <div className="flex flex-wrap items-center justify-between gap-3 py-3" key={s.id}><div><strong>{s.title}</strong><p className="muted">{s.vehicle.plate} · {s.dueDate?.toISOString().slice(0,10) ?? "—"} · {s.dueOdometer === null ? "—" : `${s.dueOdometer.toLocaleString("vi-VN")} km`}</p><span className={`badge mt-2 ${s.active ? "badge-warning" : "badge-success"}`}>{s.active ? "Đang theo dõi" : "Đã hoàn thành"}</span></div>{canManage && s.active && <Link className="btn-secondary" href={`/maintenance/schedules/${s.id}/complete`}>Gắn công việc đã thực hiện</Link>}</div>)}</div> : <p className="muted mt-3">Chưa có lịch nhắc.</p>}</section>
    <section className="card"><h2 className="section-title flex items-center gap-2"><FileText size={19} className="text-[#153c88]"/>Giấy tờ ({documents.length})</h2>{documents.length ? <div className="divider-list mt-3">{documents.map(d => <div className="flex flex-wrap justify-between gap-2 py-3" key={d.id}><div><strong>{d.kind}</strong><p className="muted">{d.vehicle.plate} · {d.documentNumber || "Không có số"} · Hết hạn: {d.expiresAt?.toISOString().slice(0,10) ?? "Không xác định"}</p></div>{d.objectKey && <a className="btn-secondary" href={`/api/documents/${d.id}`}>Tải tệp ↓</a>}</div>)}</div> : <p className="muted mt-3">Chưa có giấy tờ.</p>}</section>
    <section className="card"><h2 className="section-title flex items-center gap-2"><ClipboardList size={19} className="text-[#153c88]"/>Lịch sử bảo dưỡng / sửa chữa</h2>{records.length ? <div className="divider-list mt-3">{records.map(r => <div key={r.id} className="flex flex-wrap justify-between gap-3 py-3"><div><strong>{r.kind === "REPAIR" ? "Sửa chữa" : "Bảo dưỡng"} · {r.vehicle.plate}</strong><p className="muted">{r.occurredAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {r.odometer.toLocaleString("vi-VN")} km</p><p className="mt-1">{r.description}</p><p className="muted">{r.vendor || "Không ghi gara"}</p></div><div className="money font-semibold">{r.expense ? <Link className="text-blue-700" href={`/expenses/${r.expenseId}`}>{formatVND(r.expense.amount.toString())}</Link> : "Không phát sinh chi phí"}</div></div>)}</div> : <p className="muted mt-3">Chưa có lịch sử phù hợp.</p>}
    <div className="flex justify-between">{page > 1 ? <Link href={`?${query}&page=${page-1}`} className="text-blue-700">← Trước</Link> : <span/>}{count > page*15 && <Link href={`?${query}&page=${page+1}`} className="text-blue-700">Tiếp →</Link>}</div></section>
  </section>;
}
