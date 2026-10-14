import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { dateSchema, vnDateToUTC } from "@/lib/finance";
import { boundedReportPage, tripWithinRange } from "@/lib/report-period";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { Route } from "lucide-react";

export default async function Trips({ searchParams }: { searchParams: Promise<{ vehicleId?: string; from?: string; to?: string; page?: string; created?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const params = await searchParams;
  const vehicles = await prisma.vehicle.findMany({ where: { organizationId: organization.id, ...vehicleScope(membership.role, user.id) }, select: { id: true, name: true, plate: true } });
  const vehicleId = vehicles.some(v => v.id === params.vehicleId) ? params.vehicleId : undefined;
  const from = params.from && dateSchema.safeParse(params.from).success ? vnDateToUTC(params.from) : undefined;
  const to = params.to && dateSchema.safeParse(params.to).success ? new Date(vnDateToUTC(params.to).getTime() + 86400000) : undefined;
  const where = { organizationId: organization.id, vehicle: vehicleScope(membership.role, user.id), ...(vehicleId ? { vehicleId } : {}), ...tripWithinRange(from, to) };
  const [aggregate, count] = await Promise.all([
    prisma.tripLog.aggregate({ where, _sum: { distance: true } }),
    prisma.tripLog.count({ where })
  ]);
  const page = boundedReportPage(params.page, count, 20);
  const trips = await prisma.tripLog.findMany({ where, include: { vehicle: true, driver: { select: { name: true, email: true } } }, orderBy: [{ startedAt: "desc" }, { id: "desc" }], skip: (page-1)*20, take: 20 });
  const query = new URLSearchParams({ ...(vehicleId ? { vehicleId } : {}), ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}) });
  return <section className="space-y-5"><PageHeader eyebrow="VẬN HÀNH PHƯƠNG TIỆN" title="Hành trình & số km" description="Ghi nhận quãng đường thực tế và theo dõi hành trình của từng xe." action={["OWNER", "ADMIN", "MANAGER", "DRIVER"].includes(membership.role) ? <Link href="/trips/new" className="btn w-full sm:w-auto"><Route size={17}/>Ghi hành trình</Link> : undefined}/>
    {params.created && <p className="rounded-xl bg-green-50 p-3 text-green-800" role="status">Đã ghi hành trình.</p>}
    <FilterDrawer title="Lọc hành trình" resetHref="/trips"><form method="get" className="grid gap-3 sm:grid-cols-4"><label><span className="label">Xe</span><select name="vehicleId" defaultValue={vehicleId ?? ""}><option value="">Tất cả xe</option>{vehicles.map(v => <option value={v.id} key={v.id}>{v.plate} · {v.name}</option>)}</select></label><label><span className="label">Từ ngày</span><input name="from" type="date" defaultValue={params.from ?? ""}/></label><label><span className="label">Đến ngày</span><input name="to" type="date" defaultValue={params.to ?? ""}/></label><button className="btn mt-auto">Áp dụng lọc</button></form></FilterDrawer>
    <StatCard label="Quãng đường hành trình đã ghi nhận" value={`${(aggregate._sum.distance ?? 0).toLocaleString("vi-VN")} km`} detail={`${count} hành trình nằm trọn kỳ. Chuyến vượt ranh giới không được chia ước tính.`} tone="hero"/>
    <section className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="section-title">Lịch sử hành trình</h2><span className="badge badge-neutral">{count} chuyến</span></div>{trips.length ? <div className="grid gap-3 lg:grid-cols-2">{trips.map(t => <article className="card record-tile" key={t.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><strong className="break-words">{t.vehicle.plate} · {t.vehicle.name}</strong><p className="muted mt-1">{t.purpose || "Không ghi mục đích"}</p></div><strong className="money text-lg text-[var(--brand-deep)]">{t.distance.toLocaleString("vi-VN")} km</strong></div><p className="muted mt-4">{t.startedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} → {t.endedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p><div className="record-footer mt-3 flex flex-wrap justify-between gap-2 pt-3"><span className="muted">{t.driver?.name ?? t.driver?.email ?? "Chưa gán tài xế"}</span><span className="muted">{t.odometerStart.toLocaleString("vi-VN")} → {t.odometerEnd.toLocaleString("vi-VN")} km</span></div></article>)}</div> : <div className="card py-10 text-center"><p className="font-semibold">Chưa có hành trình phù hợp</p><p className="muted mt-2">Chọn khoảng thời gian khác hoặc ghi nhận chuyến đi.</p></div>}</section>
    <div className="flex justify-between">{page > 1 ? <Link href={`?${query}&page=${page-1}`} className="text-blue-700">← Trước</Link> : <span />}{count > page*20 && <Link href={`?${query}&page=${page+1}`} className="text-blue-700">Tiếp →</Link>}</div>
  </section>;
}
