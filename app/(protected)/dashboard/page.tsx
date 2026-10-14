import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { formatVND, todayVN } from "@/lib/finance";
import { periodChange } from "@/lib/report-period";
import { resolveDashboardPeriod } from "@/lib/dashboard-period";
import { Plus, ArrowUpRight, Bell, ReceiptText, ArrowRight, Fuel, CarFront, CalendarDays } from "lucide-react";
import { vehicleScope, expenseScope, canCreateExpense } from "@/lib/access-scope";
import { getReporting } from "@/modules/reporting/service";
import { LineChart } from "@/components/reports/line-chart";
import { DonutChart } from "@/components/reports/donut-chart";
import { BarChart } from "@/components/reports/bar-chart";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { FilterDrawer } from "@/components/ui/filter-drawer";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" });

type DashboardParams = { period?: string; from?: string; to?: string; vehicleId?: string };

export default async function Dashboard({ searchParams }: { searchParams: Promise<DashboardParams> }) {
  const { organization, user, membership } = await requireOrganizationAccess();
  const params = await searchParams;
  const today = todayVN();
  let period: ReturnType<typeof resolveDashboardPeriod>;
  try { period = resolveDashboardPeriod(params, today); }
  catch { return <section className="card space-y-3"><h1 className="page-title">Khoảng ngày chưa hợp lệ</h1><p className="error">Chọn ngày bắt đầu không sau ngày kết thúc, tối đa 366 ngày.</p><Link href="/dashboard" className="btn-secondary">Xem tháng hiện tại</Link></section>; }
  const report = await getReporting(organization.id, user.id, membership.role, { from: period.from, to: period.to, vehicleId: params.vehicleId });
  // Validate against scoped vehicles before using an ID in direct Prisma queries.
  const selectedId = report.vehicles.some(v => v.id === params.vehicleId) ? params.vehicleId : undefined;
  if (params.vehicleId && !selectedId) return <section className="card space-y-3"><h1 className="page-title">Phương tiện không khả dụng</h1><p className="error">Không tìm thấy phương tiện này trong phạm vi truy cập.</p><Link href="/dashboard" className="btn-secondary">Xem tất cả xe được phép</Link></section>;
  const vehicleIds = selectedId ? [selectedId] : report.vehicles.map(v => v.id);
  const [recent, reminders] = await Promise.all([
    prisma.expense.findMany({ where: { organizationId: organization.id, status: "POSTED", ...expenseScope(membership.role, user.id), vehicleId: { in: vehicleIds }, occurredAt: { gte: period.start, lt: period.endExclusive } }, include: { vehicle: true, category: true }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: 5 }),
    prisma.reminder.findMany({ where: { organizationId: organization.id, vehicleId: { in: vehicleIds }, vehicle: vehicleScope(membership.role, user.id), status: { in: ["UPCOMING", "DUE", "OVERDUE"] } }, include: { vehicle: { select: { plate: true } } }, orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }], take: 4 })
  ]);
  const change = periodChange(report.totalAmount, report.previousAmount);
  const fuelAmount = report.energy.reduce((sum, row) => sum + BigInt(row.amount), 0n);
  const maintenanceAmount = report.byCategory.filter(row => ["MAINTENANCE", "REPAIR"].includes(row.group)).reduce((sum, row) => sum + BigInt(row.amount), 0n);
  const firstName = user.name?.split(" ").slice(-1)[0];
  const periodLabel = period.period === "month" ? "tháng này" : period.period === "quarter" ? "quý này" : period.period === "year" ? "năm nay" : "kỳ đã chọn";
  const reportLink = `/reports?${new URLSearchParams({ from: period.from, to: period.to, ...(selectedId ? { vehicleId: selectedId } : {}) })}`;
  return <div className="dashboard-page space-y-6 lg:space-y-7">
    <PageHeader eyebrow="TỔNG QUAN / CARLOG" title="Tổng quan" description={`${firstName ? `Chào ${firstName}, ` : ""}đây là tình hình vận hành và chi phí của bạn · ${dateFormat.format(new Date())}`} action={canCreateExpense(membership.role) ? <Link className="btn w-full sm:w-auto" href="/expenses/new"><Plus size={18}/>Thêm chi phí</Link> : undefined}/>
    <FilterDrawer title="Lọc kỳ và phương tiện" resetHref="/dashboard">
    <form method="get" action="/dashboard" className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end" aria-label="Bộ lọc tổng quan">
      <label className="min-w-[130px] flex-1 sm:max-w-48"><span className="label flex items-center gap-1"><CalendarDays size={14}/>Kỳ xem</span><select name="period" defaultValue={period.period}><option value="month">Tháng này</option><option value="quarter">Quý này</option><option value="year">Năm nay</option><option value="custom">Tùy chỉnh</option></select></label>
      <label className="min-w-[170px] flex-[2] sm:max-w-72"><span className="label">Phương tiện</span><select name="vehicleId" defaultValue={selectedId ?? ""}><option value="">Tất cả xe được phép</option>{report.vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} · {v.name}</option>)}</select></label>
      <label className="min-w-[130px] flex-1 sm:max-w-44"><span className="label">Từ ngày (tùy chỉnh)</span><input name="from" type="date" defaultValue={period.from}/></label>
      <label className="min-w-[130px] flex-1 sm:max-w-44"><span className="label">Đến ngày (tùy chỉnh)</span><input name="to" type="date" defaultValue={period.to}/></label>
      <button className="btn w-full md:w-auto">Xem số liệu</button>
    </form>
    </FilterDrawer>
    <p className="period-context"><CalendarDays size={15}/><span>Kỳ dữ liệu <strong>{period.from} – {period.to}</strong></span><span className="period-dot"/><span>{selectedId ? "Một phương tiện" : "Tất cả xe được phép"}</span><span className="hidden sm:inline">· Chỉ tính giao dịch đã ghi nhận</span></p>
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4" aria-label="Chỉ số trọng tâm">
      <div className="col-span-2"><StatCard tone="hero" label={`Tổng chi phí ${periodLabel}`} value={formatVND(report.totalAmount)} detail={`${report.expenseCount} giao dịch · ${change === null ? "Chưa đủ dữ liệu kỳ trước" : `${change >= 0 ? "+" : ""}${change.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% so với kỳ trước`}`}/></div>
      <StatCard label="Nhiên liệu & sạc" value={formatVND(fuelAmount)} detail="Đã nằm trong tổng chi phí"/>
      <StatCard label="Bảo dưỡng & sửa chữa" value={formatVND(maintenanceAmount)} detail="Theo nhóm danh mục đã ghi nhận"/>
    </section>
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <LineChart title={`Xu hướng chi phí ${periodLabel}`} rows={report.monthly}/>
      <DonutChart title="Chi phí phân bổ theo danh mục" rows={report.byCategory}/>
    </section>
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Phương tiện" value={report.vehicleCount.toLocaleString("vi-VN")} detail="Trong phạm vi quản lý"/>
      <StatCard label="Quãng đường ghi nhận" value={report.distance === null ? "Chưa đủ dữ liệu" : `${report.distance.toLocaleString("vi-VN")} km`} detail="Từ các hành trình hợp lệ"/>
      <StatCard label="Chi phí bình quân / km" value={report.costPerKm === null ? "Chưa đủ dữ liệu" : `${formatVND(report.costPerKm)}/km`} detail="Chỉ tính khi có hành trình hợp lệ"/>
    </section>
    <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,1fr)]">
      <BarChart title="Chi phí theo phương tiện" rows={report.byVehicle} maxRows={5}/>
      <div className="card">
        <div className="flex items-center justify-between gap-3"><h2 className="section-title flex items-center gap-2"><Bell size={18} className="text-amber-600"/>Việc cần chú ý</h2><Link href="/notifications" className="text-xs font-bold text-blue-700 hover:underline">Xem tất cả <ArrowUpRight size={13} className="inline"/></Link></div>
        {reminders.length ? <ul className="divider-list mt-3">{reminders.map(r => <li className="flex flex-wrap items-start justify-between gap-2 py-3" key={r.id}><div className="min-w-0"><p className="font-semibold">{r.title}</p><p className="muted">{r.vehicle.plate}</p></div><span className={`badge ${r.status === "OVERDUE" ? "badge-danger" : "badge-warning"}`}>{r.status === "OVERDUE" ? "Quá hạn" : r.status === "DUE" ? "Đến hạn" : "Sắp đến hạn"}</span></li>)}</ul> : <div className="surface-subtle mt-4 p-6 text-center"><p className="font-semibold">Mọi thứ đang trong tầm kiểm soát</p><p className="muted mt-1">Không có nhắc hạn cần xử lý.</p></div>}
      </div>
    </section>
    <section className="card">
      <div className="flex items-center justify-between gap-3"><h2 className="section-title flex items-center gap-2"><ReceiptText size={18} className="text-blue-700"/>Giao dịch trong kỳ</h2><Link href="/expenses" className="text-xs font-bold text-blue-700 hover:underline">Lịch sử <ArrowRight size={14} className="inline"/></Link></div>
      {recent.length ? <ul className="divider-list mt-3">{recent.map(item => <li key={item.id}><Link href={`/expenses/${item.id}`} className="flex items-center gap-3 rounded-xl py-3 hover:bg-[#f8faff]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-blue-700">{item.category.group === "FUEL" ? <Fuel size={20}/> : <CarFront size={20}/>}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.category.name}</p><p className="muted truncate">{item.vehicle.plate} · {dateFormat.format(item.occurredAt)}</p></div><strong className="money max-w-[42%] text-right text-sm">{formatVND(item.amount.toString())}</strong></Link></li>)}</ul> : <div className="surface-subtle mt-4 p-6 text-center"><p className="font-semibold">Chưa có giao dịch</p><p className="muted mt-1">Thêm phương tiện và ghi nhận khoản chi đầu tiên để theo dõi tại đây.</p><Link href="/vehicles" className="btn-secondary mt-4">Xem phương tiện</Link></div>}
    </section>
    <div className="flex flex-wrap gap-3"><Link className="btn-secondary" href={reportLink}>Mở báo cáo theo kỳ <ArrowUpRight size={16}/></Link><Link className="btn-secondary" href="/fuel"><Fuel size={16}/>Theo dõi nhiên liệu</Link></div>
  </div>;
}
