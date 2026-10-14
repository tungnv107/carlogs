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
import { FuelForm } from "@/components/forms/fuel-form";
import { ConfirmSubmit } from "@/components/forms/confirm-submit";
import { deleteFuelLog } from "@/modules/fuel/actions";
import { canModifyExpense } from "@/lib/access-scope";

// Cap the work for a single page request even for vehicles with many years of
// fuel logs. Process the returned window chronologically for full-tank cycles.
const MAX_CONSUMPTION_LOGS = 500;

export default async function Fuel({ searchParams }: { searchParams: Promise<{ vehicleId?: string; from?: string; to?: string; page?: string; created?: string; updated?: string; deleted?: string }> }) {
  const { organization, membership, user } = await requireOrganizationAccess();
  const params = await searchParams;
  const vehicles = await prisma.vehicle.findMany({ where: { organizationId: organization.id, ...vehicleScope(membership.role, user.id) }, select: { id: true, plate: true, name: true, fuelType: true } });
  const vehicleId = vehicles.some(v => v.id === params.vehicleId) ? params.vehicleId : undefined;
  const from = params.from && dateSchema.safeParse(params.from).success ? vnDateToUTC(params.from) : undefined;
  const to = params.to && dateSchema.safeParse(params.to).success ? new Date(vnDateToUTC(params.to).getTime() + 86400000) : undefined;
  const where = { organizationId: organization.id, expense: { status: "POSTED" as const }, vehicle: vehicleScope(membership.role, user.id), ...(vehicleId ? { vehicleId } : {}), ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}) };
  const [count, summaries, cycles] = await Promise.all([
    prisma.fuelLog.count({ where }),
    prisma.fuelLog.groupBy({ by: ["unit"], where: { ...where, expense: { status: "POSTED" } }, _sum: { quantity: true }, _count: true }),
    // Use the latest bounded history, independent of the period filter, to
    // retain opening full-tank anchors within this window.
    vehicleId ? prisma.fuelLog.findMany({ where: { organizationId: organization.id, vehicleId, expense: { status: "POSTED" } }, select: { odometer: true, quantity: true, unit: true, isFullTank: true, expense: { select: { status: true } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: MAX_CONSUMPTION_LOGS }) : Promise.resolve([])
  ]);
  const page = boundedReportPage(params.page, count, 20);
  const logs = await prisma.fuelLog.findMany({ where, include: { vehicle: true, expense: true }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 });
  const aggregate = await prisma.expense.aggregate({ where: { organizationId: organization.id, status: "POSTED", fuelLog: { isNot: null }, ...(!vehicleId ? { vehicle: vehicleScope(membership.role, user.id) } : { vehicleId }), ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}) }, _sum: { amount: true } });
  const cycleRows = cycles.reverse().map(l => ({ odometer: l.odometer, quantity: l.quantity.toString(), unit: l.unit, isFullTank: l.isFullTank, posted: l.expense.status === "POSTED" }));
  const consumption = vehicleId ? consumptionPer100Km(cycleRows, "LITER") : null;
  const perUnitTotals = await Promise.all(summaries.map(async (s) => {
    const costs = await prisma.expense.aggregate({ where: { organizationId: organization.id, status: "POSTED", fuelLog: { is: { unit: s.unit } }, ...(!vehicleId ? { vehicle: vehicleScope(membership.role, user.id) } : { vehicleId }), ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}) }, _sum: { amount: true } });
    const quantity = s._sum.quantity ?? new Prisma.Decimal(0);
    return { ...s, average: quantity.gt(0) ? (costs._sum.amount ?? new Prisma.Decimal(0)).div(quantity).toDecimalPlaces(2).toString() : null };
  }));
  const query = new URLSearchParams({ ...(vehicleId ? { vehicleId } : {}), ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}) });
  const vehicleOptions = vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.name}`, fuelType: v.fuelType }));
  const toLocalInput = (date: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date).replace(" ", "T");
  return <section className="space-y-5">
    <PageHeader eyebrow="VẬN HÀNH PHƯƠNG TIỆN" title="Nhiên liệu & sạc điện" description="Theo dõi từng lần tiếp nhiên liệu, chi phí và tiêu hao theo xe." action={membership.role !== "VIEWER" ? <Link className="btn w-full sm:w-auto" href="/fuel/new"><FuelIcon size={17}/>Ghi nhiên liệu</Link> : undefined}/>
    {(params.created || params.updated || params.deleted) && <p role="status" className="rounded-xl bg-green-50 p-3 text-green-800">{params.deleted ? "Đã xóa lượt nhiên liệu và hủy khoản chi." : params.updated ? "Đã cập nhật lần tiếp nhiên liệu và sổ chi phí." : "Đã ghi nhận vào sổ chi phí."}</p>}
    <FilterDrawer title="Lọc lịch sử nhiên liệu" resetHref="/fuel"><form method="get" className="grid gap-3 sm:grid-cols-4"><label><span className="label">Xe</span><select name="vehicleId" defaultValue={vehicleId ?? ""}><option value="">Tất cả xe</option>{vehicles.map(v => <option value={v.id} key={v.id}>{v.plate} · {v.name}</option>)}</select></label><label><span className="label">Từ ngày</span><input type="date" name="from" defaultValue={params.from ?? ""}/></label><label><span className="label">Đến ngày</span><input type="date" name="to" defaultValue={params.to ?? ""}/></label><button className="btn mt-auto">Áp dụng lọc</button></form></FilterDrawer>
    <div className="grid gap-3 sm:grid-cols-3"><StatCard tone="hero" label="Tổng tiền đã ghi nhận" value={formatVND(aggregate._sum.amount?.toString() ?? "0")}/>{perUnitTotals.map(s => <StatCard key={s.unit} label={s.unit === "LITER" ? "Xăng/dầu (L)" : "Sạc điện (kWh)"} value={s._sum.quantity?.toString() ?? "0"} detail={`${s._count} lần · Giá bình quân ${s.average === null ? "Chưa đủ dữ liệu" : `${s.average} ₫/${s.unit === "LITER" ? "L" : "kWh"}`}`}/>)}</div>
    {vehicleId && <div className="insight-band flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">ĐO LƯỜNG HIỆU SUẤT</p><p className="mt-1 font-medium">Tiêu hao nhiên liệu (chu kỳ đầy bình)</p></div><strong className="money text-xl">{consumption === null ? "Chưa đủ dữ liệu" : `${consumption.toFixed(2)} L/100km`}</strong><p className="muted sm:max-w-xs">Tính trong tối đa {MAX_CONSUMPTION_LOGS} lần tiếp nhiên liệu gần nhất của xe, không phụ thuộc bộ lọc ngày.</p></div>}
    <section className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="section-title">Lịch sử tiếp nhiên liệu</h2><span className="badge badge-neutral">{count} lượt</span></div>{logs.length ? <div className="grid gap-3 lg:grid-cols-2">{logs.map(l => <article className="card record-tile flex flex-col justify-between gap-4" key={l.id}><div><div className="flex items-center justify-between gap-2"><strong className="min-w-0 break-words">{l.vehicle.plate} · {l.vehicle.name}</strong><span className="badge badge-neutral shrink-0">{l.unit === "LITER" ? "Lít" : "kWh"}</span></div><p className="muted mt-2">{l.occurredAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {l.odometer.toLocaleString("vi-VN")} km</p><p className="muted mt-1">{l.quantity.toString()} {l.unit === "LITER" ? "L" : "kWh"} × {l.unitPrice.toString()} ₫ {l.isFullTank ? "· Đầy bình" : ""}</p></div><div className="record-footer flex flex-wrap items-end justify-between gap-3 pt-3"><strong className="money text-lg">{formatVND(l.expense.amount.toString())}</strong><Link className="text-sm font-semibold text-[var(--brand-deep)]" href={`/expenses/${l.expenseId}`}>Xem chứng từ →</Link></div>{canModifyExpense(membership.role, user.id, l.createdById, l.vehicle.assignedToId) && <div className="space-y-2"><div className="flex gap-2"><form action={deleteFuelLog.bind(null, l.id)}><ConfirmSubmit prompt="Xóa lượt tiếp nhiên liệu và hủy khoản chi tương ứng?">Xóa</ConfirmSubmit></form></div><details className="rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer font-semibold text-blue-800">Sửa / cập nhật</summary><div className="mt-3"><FuelForm vehicles={vehicleOptions} initialTime={toLocalInput(l.occurredAt)} record={{ id: l.id, vehicleId: l.vehicleId, occurredAt: toLocalInput(l.occurredAt), odometer: l.odometer, unit: l.unit, quantity: l.quantity.toString(), unitPrice: l.unitPrice.toString(), isFullTank: l.isFullTank, vendor: l.vendor }}/></div></details></div>}</article>)}</div> : <div className="card py-10 text-center"><p className="font-semibold">Chưa có lần đổ nhiên liệu hoặc sạc phù hợp.</p><p className="muted mt-2">Thử điều chỉnh bộ lọc hoặc ghi giao dịch mới.</p></div>}</section>
    <div className="flex justify-between">{page > 1 ? <Link href={`?${query}&page=${page-1}`} className="text-blue-700">← Trước</Link> : <span />}{count > page * 20 && <Link href={`?${query}&page=${page+1}`} className="text-blue-700">Tiếp →</Link>}</div>
  </section>;
}
