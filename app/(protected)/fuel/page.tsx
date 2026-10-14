import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { vehicleScope } from "@/lib/access-scope";
import { formatVND, vnDateToUTC, dateSchema } from "@/lib/finance";
import { consumptionPer100Km } from "@/lib/operations-rules";
import { Prisma } from "@prisma/client";
import { boundedReportPage } from "@/lib/report-period";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { Fuel as FuelIcon } from "lucide-react";

export default async function Fuel({ searchParams }: { searchParams: Promise<{ vehicleId?: string; from?: string; to?: string; page?: string; created?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const params = await searchParams;
  const vehicles = await prisma.vehicle.findMany({ where: { organizationId: organization.id, ...vehicleScope(membership.role, user.id) }, select: { id: true, plate: true, name: true } });
  const vehicleId = vehicles.some(v => v.id === params.vehicleId) ? params.vehicleId : undefined;
  const from = params.from && dateSchema.safeParse(params.from).success ? vnDateToUTC(params.from) : undefined;
  const to = params.to && dateSchema.safeParse(params.to).success ? new Date(vnDateToUTC(params.to).getTime() + 86400000) : undefined;
  const where = { organizationId: organization.id, vehicle: vehicleScope(membership.role, user.id), ...(vehicleId ? { vehicleId } : {}), ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}) };
  const [count, summaries, cycles] = await Promise.all([
    prisma.fuelLog.count({ where }),
    prisma.fuelLog.groupBy({ by: ["unit"], where: { ...where, expense: { status: "POSTED" } }, _sum: { quantity: true }, _count: true }),
    // Use the full history so a period filter cannot silently hide the opening full-tank anchor.
    vehicleId ? prisma.fuelLog.findMany({ where: { organizationId: organization.id, vehicleId }, include: { expense: { select: { status: true } } }, orderBy: [{ occurredAt: "asc" }, { id: "asc" }] }) : Promise.resolve([])
  ]);
  const page = boundedReportPage(params.page, count, 20);
  const logs = await prisma.fuelLog.findMany({ where, include: { vehicle: true, expense: true }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 });
  const aggregate = await prisma.expense.aggregate({ where: { organizationId: organization.id, status: "POSTED", fuelLog: { isNot: null }, ...(!vehicleId ? { vehicle: vehicleScope(membership.role, user.id) } : { vehicleId }), ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}) }, _sum: { amount: true } });
  const cycleRows = cycles.map(l => ({ odometer: l.odometer, quantity: l.quantity.toString(), unit: l.unit, isFullTank: l.isFullTank, posted: l.expense.status === "POSTED" }));
  const consumption = vehicleId ? consumptionPer100Km(cycleRows, "LITER") : null;
  const perUnitTotals = await Promise.all(summaries.map(async (s) => {
    const costs = await prisma.expense.aggregate({ where: { organizationId: organization.id, status: "POSTED", fuelLog: { is: { unit: s.unit } }, ...(!vehicleId ? { vehicle: vehicleScope(membership.role, user.id) } : { vehicleId }), ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}) }, _sum: { amount: true } });
    const quantity = s._sum.quantity ?? new Prisma.Decimal(0);
    return { ...s, average: quantity.gt(0) ? (costs._sum.amount ?? new Prisma.Decimal(0)).div(quantity).toDecimalPlaces(2).toString() : null };
  }));
  const query = new URLSearchParams({ ...(vehicleId ? { vehicleId } : {}), ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}) });
  return <section className="space-y-5">
    <PageHeader eyebrow="VẬN HÀNH PHƯƠNG TIỆN" title="Nhiên liệu & sạc điện" description="Theo dõi từng lần tiếp nhiên liệu, chi phí và tiêu hao theo xe." action={membership.role !== "VIEWER" ? <Link className="btn w-full sm:w-auto" href="/fuel/new"><FuelIcon size={17}/>Ghi nhiên liệu</Link> : undefined}/>
    {params.created && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">Đã ghi nhận vào sổ chi phí.</p>}
    <FilterDrawer title="Lọc lịch sử nhiên liệu" resetHref="/fuel"><form method="get" className="grid gap-3 sm:grid-cols-4"><label><span className="label">Xe</span><select name="vehicleId" defaultValue={vehicleId ?? ""}><option value="">Tất cả xe</option>{vehicles.map(v => <option value={v.id} key={v.id}>{v.plate} · {v.name}</option>)}</select></label><label><span className="label">Từ ngày</span><input type="date" name="from" defaultValue={params.from ?? ""}/></label><label><span className="label">Đến ngày</span><input type="date" name="to" defaultValue={params.to ?? ""}/></label><button className="btn mt-auto">Áp dụng lọc</button></form></FilterDrawer>
    <div className="grid gap-3 sm:grid-cols-3"><StatCard tone="hero" label="Tổng tiền đã ghi nhận" value={formatVND(aggregate._sum.amount?.toString() ?? "0")}/>{perUnitTotals.map(s => <StatCard key={s.unit} label={s.unit === "LITER" ? "Xăng/dầu (L)" : "Sạc điện (kWh)"} value={s._sum.quantity?.toString() ?? "0"} detail={`${s._count} lần · Giá bình quân ${s.average === null ? "Chưa đủ dữ liệu" : `${s.average} ₫/${s.unit === "LITER" ? "L" : "kWh"}`}`}/>)}</div>
    {vehicleId && <div className="insight-band flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">ĐO LƯỜNG HIỆU SUẤT</p><p className="mt-1 font-medium">Tiêu hao nhiên liệu (chu kỳ đầy bình)</p></div><strong className="money text-xl">{consumption === null ? "Chưa đủ dữ liệu" : `${consumption.toFixed(2)} L/100km`}</strong><p className="muted sm:max-w-xs">kWh/100km chỉ tính được với các chu kỳ sạc và quãng đường nhất quán.</p></div>}
    <section className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="section-title">Lịch sử tiếp nhiên liệu</h2><span className="badge badge-neutral">{count} lượt</span></div>{logs.length ? <div className="grid gap-3 lg:grid-cols-2">{logs.map(l => <article className="card record-tile flex flex-col justify-between gap-4" key={l.id}><div><div className="flex items-center justify-between gap-2"><strong className="min-w-0 break-words">{l.vehicle.plate} · {l.vehicle.name}</strong><span className="badge badge-neutral shrink-0">{l.unit === "LITER" ? "Lít" : "kWh"}</span></div><p className="muted mt-2">{l.occurredAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {l.odometer.toLocaleString("vi-VN")} km</p><p className="muted mt-1">{l.quantity.toString()} {l.unit === "LITER" ? "L" : "kWh"} × {l.unitPrice.toString()} ₫ {l.isFullTank ? "· Đầy bình" : ""}</p></div><div className="record-footer flex items-end justify-between gap-3 pt-3"><div><strong className="money text-lg">{formatVND(l.expense.amount.toString())}</strong>{l.expense.status === "VOID" && <p className="text-xs text-red-600">Đã hủy</p>}</div><Link className="text-sm font-semibold text-[var(--brand-deep)]" href={`/expenses/${l.expenseId}`}>Xem chứng từ →</Link></div></article>)}</div> : <div className="card py-10 text-center"><p className="font-semibold">Chưa có lần đổ nhiên liệu hoặc sạc phù hợp.</p><p className="muted mt-2">Thử điều chỉnh bộ lọc hoặc ghi giao dịch mới.</p></div>}</section>
    <div className="flex justify-between">{page > 1 ? <Link href={`?${query}&page=${page-1}`} className="text-blue-700">← Trước</Link> : <span />}{count > page * 20 && <Link href={`?${query}&page=${page+1}`} className="text-blue-700">Tiếp →</Link>}</div>
  </section>;
}
