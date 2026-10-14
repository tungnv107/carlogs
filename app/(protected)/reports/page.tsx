import Link from "next/link";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { getReporting, type ReportSelection } from "@/modules/reporting/service";
import { formatVND } from "@/lib/finance";
import { periodChange } from "@/lib/report-period";
import { formatSharePercent } from "@/lib/report-share";
import { BarChart } from "@/components/reports/bar-chart";
import { LineChart } from "@/components/reports/line-chart";
import { DonutChart } from "@/components/reports/donut-chart";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { FilterDrawer } from "@/components/ui/filter-drawer";
import { CalendarRange, FileDown, Printer, TrendingUp } from "lucide-react";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short" });

export default async function Reports({ searchParams }: { searchParams: Promise<ReportSelection> }) {
  const { organization, user, membership } = await requireOrganizationAccess();
  const params = await searchParams;
  let data: Awaited<ReturnType<typeof getReporting>>;
  try { data = await getReporting(organization.id, user.id, membership.role, params); }
  catch { return <section className="card"><h1 className="text-xl font-bold">Không thể tạo báo cáo</h1><p className="error mt-3">Kiểm tra khoảng ngày (tối đa 366 ngày) và thử lại.</p><Link className="btn-secondary mt-4" href="/reports">Xem kỳ hiện tại</Link></section>; }
  const change = periodChange(data.totalAmount, data.previousAmount);
  const expenseUrl = new URLSearchParams({ from: data.period.from, to: data.period.to, ...(params.vehicleId ? { vehicleId: params.vehicleId } : {}), ...(params.categoryId ? { categoryId: params.categoryId } : {}) });
  const pageUrl = (page: number) => { const q = new URLSearchParams(expenseUrl); q.set("page", String(page)); return `/reports?${q.toString()}#details`; };
  const totals = [
    { label: "Tổng chi phí", value: formatVND(data.totalAmount) },
    { label: "Giao dịch hợp lệ", value: String(data.expenseCount) },
    { label: "Phương tiện trong phạm vi", value: String(data.vehicleCount) },
    { label: "Quãng đường ghi nhận", value: data.distance === null ? "Chưa đủ dữ liệu" : `${data.distance.toLocaleString("vi-VN")} km` },
    { label: "Chi phí / km", value: data.costPerKm === null ? "Chưa đủ dữ liệu" : formatVND(data.costPerKm) + "/km" },
    { label: "Nhắc hạn chưa xử lý", value: String(data.reminderCount) }
  ];
  return <div className="space-y-6">
    <PageHeader eyebrow="THỐNG KÊ VẬN HÀNH" title="Báo cáo & phân tích" description="Theo dõi các khoản đã ghi nhận, so sánh hiệu quả phương tiện và tải dữ liệu theo kỳ." action={<Link className="btn-secondary w-full sm:w-auto" href="/dashboard">← Tổng quan</Link>}/>
    <div className="report-period-strip" aria-label="Phạm vi báo cáo"><CalendarRange aria-hidden size={17}/><span>Dữ liệu từ <strong>{data.period.from}</strong> đến <strong>{data.period.to}</strong></span><span className="report-period-divider" aria-hidden/><span>{params.vehicleId ? "Theo phương tiện được chọn" : "Tất cả phương tiện trong quyền truy cập"}</span></div>
    <FilterDrawer title="Bộ lọc kỳ báo cáo" resetHref="/reports"><form method="get" action="/reports" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label><span className="label">Từ ngày</span><input type="date" name="from" defaultValue={data.period.from} required /></label>
      <label><span className="label">Đến ngày</span><input type="date" name="to" defaultValue={data.period.to} required /></label>
      <label><span className="label">Phương tiện</span><select name="vehicleId" defaultValue={params.vehicleId ?? ""}><option value="">Tất cả xe được phép</option>{data.vehicles.map(v => <option value={v.id} key={v.id}>{v.plate} · {v.name}</option>)}</select></label>
      <label><span className="label">Danh mục</span><select name="categoryId" defaultValue={params.categoryId ?? ""}><option value="">Tất cả danh mục</option>{data.categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
      <button className="btn self-end">Áp dụng bộ lọc</button>
    </form></FilterDrawer>
    {["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"].includes(membership.role) && <div className="flex flex-wrap items-center gap-2"><span className="muted mr-auto hidden sm:inline">Xuất báo cáo kỳ đang xem</span><a className="btn-secondary flex-1 sm:flex-none" href={`/api/reports/export?${expenseUrl.toString()}&format=xlsx`}><FileDown size={17}/>Excel</a><a className="btn-secondary flex-1 sm:flex-none" href={`/api/reports/export?${expenseUrl.toString()}&format=csv`}><FileDown size={17}/>CSV</a><Link className="btn-secondary flex-1 sm:flex-none" href={`/reports/print?${expenseUrl.toString()}`}><Printer size={17}/>In / PDF</Link></div>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><StatCard label="Tổng chi phí trong kỳ" value={totals[0].value} detail={`${data.expenseCount.toLocaleString("vi-VN")} giao dịch hợp lệ`} tone="hero"/>{totals.slice(2,5).map(kpi => <StatCard key={kpi.label} label={kpi.label} value={kpi.value}/>)}<StatCard label={totals[5].label} value={totals[5].value}/><StatCard label="Biến động kỳ trước" value={change === null ? "Chưa đủ dữ liệu" : `${change > 0 ? "+" : ""}${change.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`} detail={`Kỳ trước: ${formatVND(data.previousAmount)}`}/></div>
    <div className="flex items-center gap-2"><TrendingUp size={20} className="text-teal"/><h2 className="section-title">Xu hướng và cơ cấu</h2></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <LineChart title="Xu hướng chi phí theo tháng" rows={data.monthly}/>
      <DonutChart title="Cơ cấu chi phí theo danh mục" rows={data.byCategory}/>
      <BarChart title="Chi phí theo phương tiện" rows={data.byVehicle}/>
      <BarChart title="Nhiên liệu/sạc theo tháng (VND)" rows={data.fuelMonthly}/>
      <LineChart title="Chi phí / km theo tháng (hành trình tính vào tháng kết thúc)" rows={data.costPerKmMonthly}/>
      <BarChart title="Top 5 xe chi phí cao" rows={data.byVehicle} maxRows={5}/>
    </div>
    <section className="card"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="section-title">Tổng hợp theo danh mục</h2><span className="chart-kicker">CƠ CẤU CHI PHÍ</span></div>
      {data.byCategory.length === 0 ? <p className="muted mt-3">Chưa có giao dịch phù hợp.</p> : <div className="mt-5 space-y-5">{data.byCategory.map(row => { const share = formatSharePercent(row.amount, data.totalAmount); return <div key={row.key} className="report-share-row"><div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{row.label} <span className="muted">· {row.count} khoản</span></span><strong className="money text-sm">{formatVND(row.amount)} <span className="text-[var(--text-secondary)]">· {share}%</span></strong></div><div className="report-share-track" role="meter" aria-label={`Tỷ trọng ${row.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(share)}><div className="report-share-fill" style={{ width: `${share}%` }}/></div></div>; })}</div>}
    </section>
    <section className="card"><h2 className="section-title">Nhiên liệu và sạc điện</h2><p className="muted my-2">Mỗi đơn vị được tính riêng. Giá bình quân có trọng số bằng tổng tiền POSTED chia tổng lượng.</p>
      {data.energy.length === 0 ? <p className="muted">Chưa có giao dịch nhiên liệu trong kỳ.</p> : data.energy.map(row => <div key={row.unit} className="mt-2 border-t pt-3"><strong>{row.unit === "LITER" ? "Lít" : "kWh"}: {Number(row.quantity).toLocaleString("vi-VN", { maximumFractionDigits: 3 })}</strong><p className="muted">Tổng {formatVND(row.amount)} · Giá bình quân {row.average ? formatVND(row.average) : "Chưa đủ dữ liệu"}/{row.unit === "LITER" ? "L" : "kWh"}</p></div>)}
    </section>
    <section className="card"><h2 className="section-title">So sánh phương tiện trong cùng kỳ</h2><p className="muted mt-2">Chi phí lấy từ sổ POSTED theo bộ lọc; km chỉ tính các hành trình nằm trọn kỳ. Kỳ trước có số ngày tương đương.</p>
      {data.comparedVehicles.length === 0 ? <p className="muted mt-3">Không có phương tiện trong phạm vi.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{data.comparedVehicles.map(row => {
        const delta = periodChange(row.amount, row.previousAmount);
        return <article key={row.id} className="report-vehicle-card"><h3 className="break-words font-bold text-[var(--text-primary)]">{row.label}</h3><p className="muted text-sm">{row.count} giao dịch trong kỳ</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
            <div><dt className="muted">Tổng chi phí</dt><dd className="break-words font-semibold">{formatVND(row.amount)}</dd></div>
            <div><dt className="muted">Chi phí nhiên liệu/sạc</dt><dd className="break-words font-semibold">{formatVND(row.fuelAmount)}</dd></div>
            <div><dt className="muted">Km ghi nhận</dt><dd className="font-semibold">{row.distance === null ? "Chưa đủ dữ liệu" : `${row.distance.toLocaleString("vi-VN")} km`}</dd></div>
            <div><dt className="muted">Chi phí/km</dt><dd className="break-words font-semibold">{row.costPerKm === null ? "Chưa đủ dữ liệu" : `${formatVND(row.costPerKm)}/km`}</dd></div>
            <div><dt className="muted">Kỳ trước</dt><dd className="break-words font-semibold">{formatVND(row.previousAmount)}</dd></div>
            <div><dt className="muted">Thay đổi so với kỳ trước</dt><dd className="font-semibold">{delta === null ? "Chưa đủ cơ sở tính %" : `${delta.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`}</dd></div>
          </dl>
        </article>;
      })}</div>}
    </section>
    <section id="details" className="card scroll-mt-4"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">Chi tiết giao dịch ({data.detailsCount})</h2><span className="muted">Trang {data.page} / {Math.max(1, Math.ceil(data.detailsCount / data.pageSize))}</span></div>
      {data.details.length === 0 ? <p className="muted mt-3">Không có dữ liệu trong kỳ.</p> : <div className="mt-3 space-y-2">{data.details.map(row => <div key={row.id} className="report-detail-row grid gap-2 p-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center"><div className="text-sm">{dateFormat.format(row.occurredAt)}<p className="muted">{row.vehicle.plate}</p></div><div className="min-w-0"><Link className="font-semibold text-[var(--brand-deep)] underline underline-offset-4" href={`/expenses/${row.id}`}>{row.category.name}</Link><p className="break-words text-sm">{row.description ?? row.vendor ?? "—"}</p><p className="muted break-words">{row.vehicle.name} · {row.createdBy.name ?? row.createdBy.email} · {row.odometer ?? "—"} km · {row.attachments.length} chứng từ</p></div><strong className="money sm:text-right">{formatVND(row.amount.toString())}</strong></div>)}</div>}
      <div className="mt-4 flex justify-between gap-3">{data.page > 1 ? <Link href={pageUrl(data.page - 1)} className="btn-secondary">← Trước</Link> : <span/>}{data.page * data.pageSize < data.detailsCount && <Link href={pageUrl(data.page + 1)} className="btn-secondary">Tiếp →</Link>}</div>
    </section>
    <p className="muted">Chi phí/km chỉ dựa trên quãng đường hành trình đã nhập trong cùng kỳ; dữ liệu hành trình có thể chưa đầy đủ. Khoản nhiên liệu và bảo dưỡng không được cộng lần thứ hai.</p>
  </div>;
}
