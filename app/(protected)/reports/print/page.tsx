import Link from "next/link";
import { requireOrganizationAccess } from "@/modules/auth/guards";
import { getReporting, getReportScope, type ReportSelection } from "@/modules/reporting/service";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/finance";
import { PrintButton } from "@/components/reports/print-button";

const MAX_PRINT_ROWS = 1000;
const dateVN = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short" });

export default async function PrintableReport({ searchParams }: { searchParams: Promise<ReportSelection> }) {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"]);
  const params = await searchParams;
  let report: Awaited<ReturnType<typeof getReporting>>;
  let scope: Awaited<ReturnType<typeof getReportScope>>;
  try {
    [report, scope] = await Promise.all([
      getReporting(organization.id, user.id, membership.role, params),
      getReportScope(organization.id, user.id, membership.role, params)
    ]);
  } catch {
    return <section className="card"><h1 className="text-xl font-bold">Không thể in báo cáo</h1><p className="error mt-3">Khoảng thời gian không hợp lệ. Mỗi báo cáo tối đa 366 ngày.</p><Link href="/reports" className="btn-secondary mt-4">Quay lại</Link></section>;
  }

  const entries = await prisma.expense.findMany({
    where: scope.where,
    include: { vehicle: { select: { plate: true, name: true } }, category: { select: { name: true } }, createdBy: { select: { name: true, email: true } } },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: MAX_PRINT_ROWS
  });
  const vehicleLabel = params.vehicleId ? scope.vehicles.find(v => v.id === params.vehicleId)?.plate ?? "Không thuộc phạm vi được phép" : "Tất cả xe được phép";
  const categoryLabel = params.categoryId ? scope.categories.find(c => c.id === params.categoryId)?.name ?? "Không tồn tại" : "Tất cả danh mục";
  const backQuery = new URLSearchParams({ from: report.period.from, to: report.period.to, ...(params.vehicleId ? { vehicleId: params.vehicleId } : {}), ...(params.categoryId ? { categoryId: params.categoryId } : {}) });

  return <article className="print-report mx-auto max-w-6xl space-y-6 bg-white p-4 text-slate-900 sm:p-8">
    <header className="space-y-3 border-b-2 border-slate-700 pb-5">
      <div className="print-controls flex flex-wrap justify-between gap-3"><Link className="btn-secondary" href={`/reports?${backQuery.toString()}`}>← Quay lại báo cáo</Link><PrintButton /></div>
      <p className="text-sm font-semibold uppercase tracking-wide">{organization.name}</p>
      <h1 className="text-2xl font-extrabold">BÁO CÁO CHI PHÍ PHƯƠNG TIỆN</h1>
      <p>Kỳ báo cáo: <strong>{report.period.from} – {report.period.to}</strong> (giờ Việt Nam)</p>
      <p>Phương tiện: {vehicleLabel} · Danh mục: {categoryLabel}</p>
      <p className="text-sm text-slate-600">Chỉ tính giao dịch POSTED. Đơn vị tiền: VND.</p>
    </header>
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div><p className="text-sm text-slate-600">Tổng chi phí</p><p className="text-xl font-bold">{formatVND(report.totalAmount)}</p></div>
      <div><p className="text-sm text-slate-600">Số giao dịch</p><p className="text-xl font-bold">{report.expenseCount}</p></div>
      <div><p className="text-sm text-slate-600">Xe trong phạm vi</p><p className="text-xl font-bold">{report.vehicleCount}</p></div>
      <div><p className="text-sm text-slate-600">Chi phí/km</p><p className="text-xl font-bold">{report.costPerKm === null ? "Chưa đủ dữ liệu" : `${formatVND(report.costPerKm)}/km`}</p></div>
    </section>
    <section><h2 className="mb-3 text-lg font-bold">Tổng hợp theo danh mục</h2>
      <table className="print-table w-full border-collapse text-left text-sm"><thead><tr><th>Danh mục</th><th className="text-right">Số khoản</th><th className="text-right">Số tiền (VND)</th></tr></thead>
        <tbody>{report.byCategory.map(row => <tr key={row.key}><td>{row.label}</td><td className="text-right">{row.count}</td><td className="text-right">{formatVND(row.amount)}</td></tr>)}<tr className="font-bold"><td>TỔNG CỘNG</td><td className="text-right">{report.expenseCount}</td><td className="text-right">{formatVND(report.totalAmount)}</td></tr></tbody>
      </table>
    </section>
    <section><h2 className="mb-3 text-lg font-bold">Chi tiết giao dịch</h2>
      {report.detailsCount > MAX_PRINT_ROWS && <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Bản in chỉ liệt kê {MAX_PRINT_ROWS} / {report.detailsCount} giao dịch gần nhất; số liệu tổng hợp phía trên vẫn tính toàn bộ. Hãy thu hẹp kỳ hoặc tải Excel để xem đủ giao dịch.</p>}
      <table className="print-table w-full border-collapse text-left text-xs"><thead><tr><th>Ngày</th><th>Biển số</th><th>Danh mục / nội dung</th><th>Người ghi</th><th className="text-right">VND</th></tr></thead>
        <tbody>{entries.map(row => <tr key={row.id}><td className="whitespace-nowrap">{dateVN.format(row.occurredAt)}</td><td>{row.vehicle.plate}</td><td>{row.category.name}<br /><span className="text-slate-600">{row.description ?? row.vendor ?? "—"}</span></td><td>{row.createdBy.name ?? row.createdBy.email}</td><td className="whitespace-nowrap text-right">{formatVND(row.amount.toString())}</td></tr>)}</tbody>
      </table>
      {entries.length === 0 && <p className="mt-3 text-sm">Không có giao dịch trong kỳ.</p>}
    </section>
    <footer className="border-t pt-3 text-xs text-slate-600">Nguồn dữ liệu: sổ chi phí đã ghi nhận. Quãng đường lấy từ các hành trình hợp lệ; nếu chưa nhập đủ hành trình, chi phí/km chỉ mang tính tham khảo. Dùng chức năng In → Lưu dưới dạng PDF của trình duyệt để lưu báo cáo.</footer>
  </article>;
}
