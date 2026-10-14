import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { resolveDocumentReminder } from "@/modules/maintenance/actions";
import { PageHeader } from "@/components/ui/page-header";
import { Bell, CheckCircle2, CalendarClock } from "lucide-react";

const statusLabels = { UPCOMING: "Sắp đến hạn", DUE: "Đến hạn", OVERDUE: "Quá hạn", RESOLVED: "Đã xử lý" };

export default async function Notifications({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const { status } = await searchParams;
  const statuses = ["UPCOMING", "DUE", "OVERDUE", "RESOLVED"] as const;
  const selected = statuses.find(s => s === status);
  const reminders = await prisma.reminder.findMany({ where: { organizationId: organization.id, vehicle: vehicleScope(membership.role, user.id), ...(selected ? { status: selected } : {}) }, include: { vehicle: { select: { plate: true, name: true } } }, orderBy: [{ status: "asc" }, { dueDate: "asc" }], take: 100 });
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(membership.role);
  return <section className="space-y-5"><PageHeader eyebrow="NHẮC VIỆC & GIẤY TỜ" title="Trung tâm nhắc hạn" description="Theo dõi các mốc bảo dưỡng, số km và giấy tờ được cập nhật bởi tác vụ định kỳ."/>
    <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Lọc theo trạng thái"><Link href="/notifications" aria-current={!selected ? "page" : undefined} className={selected ? "btn-secondary shrink-0" : "btn shrink-0"}>Tất cả</Link>{statuses.map(s => <Link aria-current={selected === s ? "page" : undefined} className={selected === s ? "btn shrink-0" : "btn-secondary shrink-0"} href={`/notifications?status=${s}`} key={s}>{statusLabels[s]}</Link>)}</div>
    <div className="insight-band flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><CalendarClock aria-hidden size={22} className="text-[var(--brand-primary)]"/><div><p className="text-sm font-bold">{selected ? statusLabels[selected] : "Danh sách nhắc hạn"}</p><p className="muted">Các mốc trong phạm vi phương tiện bạn được phép xem</p></div></div><strong className="text-2xl tabular-nums">{reminders.length}</strong></div>
    {reminders.length ? <div className="grid gap-3 lg:grid-cols-2">{reminders.map(r => <article key={r.id} className="card record-tile flex flex-col gap-4"><div className="flex items-center gap-2"><Bell aria-hidden size={17} className="text-[var(--brand-primary)]"/><span className={`badge ${r.status === "OVERDUE" ? "badge-danger" : r.status === "DUE" ? "badge-warning" : r.status === "RESOLVED" ? "badge-success" : "badge-neutral"}`}>{statusLabels[r.status]}</span></div><div className="flex-1"><h2 className="section-title break-words">{r.title}</h2><p className="muted mt-1 break-words">{r.vehicle.plate} · {r.vehicle.name}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="surface-subtle p-3"><dt className="muted">Hạn ngày</dt><dd className="mt-1 font-bold tabular-nums">{r.dueDate?.toISOString().slice(0,10) ?? "—"}</dd></div><div className="surface-subtle p-3"><dt className="muted">Hạn km</dt><dd className="mt-1 font-bold tabular-nums">{r.dueOdometer?.toLocaleString("vi-VN") ?? "—"}</dd></div></dl></div><div className="record-footer flex flex-wrap gap-2 pt-4"><Link href={`/maintenance?vehicleId=${r.vehicleId}`} className="btn-secondary flex-1">Xem nghiệp vụ</Link>{canManage && r.status !== "RESOLVED" && r.sourceKey.startsWith("document:") && <form action={resolveDocumentReminder.bind(null, r.id)}><button className="btn"><CheckCircle2 size={17}/>Đã gia hạn</button></form>}</div></article>)}</div> : <div className="card flex flex-col items-center gap-3 py-12 text-center"><CheckCircle2 size={40} className="text-teal"/><h2 className="section-title">Không có nhắc hạn trong bộ lọc này</h2><p className="muted">Bạn có thể xem tất cả hoặc quản lý lịch bảo dưỡng.</p><Link className="btn-secondary" href="/maintenance">Quản lý lịch bảo dưỡng</Link></div>}
  </section>;
}
