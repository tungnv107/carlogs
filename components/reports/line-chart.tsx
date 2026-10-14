import { formatVND } from "@/lib/finance";
import { chartFraction, compareVndAmounts } from "@/lib/report-share";

/** Compact, accessible SVG trend; financial sums remain strings until display. */
export function LineChart({ title, rows }: { title: string; rows: { label: string; amount: string }[] }) {
  const points = rows.slice(0, 24);
  const ceiling = points.reduce((top, row) => compareVndAmounts(row.amount, top) > 0 ? row.amount : top, "1");
  const x = (index: number) => 28 + index * (300 / Math.max(1, points.length - 1));
  const y = (value: string) => 150 - chartFraction(value, ceiling) * 122;
  const coords = points.map((point, index) => `${x(index)},${y(point.amount)}`).join(" ");

  return <section className="card chart-card min-w-0 space-y-4">
    <div className="chart-heading"><div><p className="eyebrow">PHÂN TÍCH XU HƯỚNG</p><h2 className="section-title mt-2">{title}</h2></div><span className="chart-kicker">Theo kỳ</span></div>
    {points.length === 0 ? <p className="muted">Chưa có dữ liệu trong khoảng thời gian đã chọn.</p> : <>
      <svg viewBox="0 0 356 180" role="img" aria-label={`${title}: ${points.map(p => `${p.label} ${formatVND(p.amount)}`).join('; ')}`} className="chart-svg w-full" preserveAspectRatio="xMidYMid meet">
        <defs><linearGradient id="xelogTrendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3d89f7" stopOpacity=".27"/><stop offset="100%" stopColor="#3d89f7" stopOpacity="0"/></linearGradient></defs>
        {[28, 89, 150].map(line => <line key={line} x1="28" x2="328" y1={line} y2={line} className="chart-grid-line" strokeDasharray="3 5" />)}
        <polygon points={`28,150 ${coords} 328,150`} fill="url(#xelogTrendArea)" />
        <polyline points={coords} fill="none" stroke="#3478e8" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => <circle key={`${point.label}-${index}`} cx={x(index)} cy={y(point.amount)} r="4" fill="#fff" stroke="#3478e8" strokeWidth="2.5"><title>{point.label}: {formatVND(point.amount)}</title></circle>)}
        <text x="28" y="172" fontSize="11" className="chart-axis-label">{points[0].label}</text>
        <text x="328" y="172" textAnchor="end" fontSize="11" className="chart-axis-label">{points[points.length - 1].label}</text>
      </svg>
      <details className="text-sm"><summary className="cursor-pointer font-medium text-blue-700">Xem số liệu chi tiết</summary><ul className="mt-2 space-y-1">{points.map(p => <li className="flex justify-between gap-2" key={p.label}><span>{p.label}</span><strong>{formatVND(p.amount)}</strong></li>)}</ul></details>
    </>}
  </section>;
}
