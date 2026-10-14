import { formatVND } from "@/lib/finance";
import { chartFraction, formatSharePercent } from "@/lib/report-share";

const palette = ["#3478e8", "#10a3a6", "#7992db", "#eca84b", "#d7778d", "#64748b", "#52b6d7"];

export function DonutChart({ title, rows }: { title: string; rows: { label: string; amount: string }[] }) {
  const total = rows.reduce((sum, row) => sum + BigInt(row.amount), 0n).toString();
  let progress = 0;
  return <section className="card chart-card min-w-0 space-y-4">
    <div className="chart-heading"><div><p className="eyebrow">CƠ CẤU CHI PHÍ</p><h2 className="section-title mt-2">{title}</h2></div></div>
    {BigInt(total) <= 0n ? <p className="muted">Chưa có dữ liệu trong khoảng thời gian đã chọn.</p> : <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0" role="img" aria-label={`${title}, tổng ${formatVND(total)}`}>
        <circle cx="90" cy="90" r="64" className="donut-track" strokeWidth="24" fill="none" />
        {rows.map((row, index) => {
          const fraction = chartFraction(row.amount, total);
          const offset = progress;
          progress += fraction;
          return <circle key={`${row.label}-${index}`} cx="90" cy="90" r="64" fill="none" stroke={palette[index % palette.length]} strokeWidth="24" strokeDasharray={`${fraction * 100} ${100 - fraction * 100}`} strokeDashoffset={-offset * 100} pathLength="100" transform="rotate(-90 90 90)"><title>{row.label}: {formatVND(row.amount)} ({formatSharePercent(row.amount, total)}%)</title></circle>;
        })}
        <text x="90" y="87" textAnchor="middle" fontSize="23" fontWeight="800" className="donut-center">{rows.length}</text>
        <text x="90" y="105" textAnchor="middle" fontSize="11" className="chart-axis-label">danh mục</text>
      </svg>
      <ul className="w-full space-y-2 text-sm">{rows.map((row, index) => <li className="flex items-start justify-between gap-2" key={`${row.label}-${index}`}><span className="flex items-start gap-2 break-words"><span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />{row.label}</span><strong className="shrink-0">{formatSharePercent(row.amount, total)}%</strong></li>)}</ul>
    </div>}
  </section>;
}
