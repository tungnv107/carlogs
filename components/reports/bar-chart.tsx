import { formatVND } from "@/lib/finance";
import { chartFraction, compareVndAmounts } from "@/lib/report-share";

/** Server-rendered, keyboard-readable chart. Values are display-only; totals stay Decimal in the service. */
export function BarChart({ title, rows, money = true, maxRows = 12 }: { title: string; rows: { label: string; amount: string }[]; money?: boolean; maxRows?: number }) {
  const visible = rows.slice(0, maxRows);
  const max = visible.reduce((top, row) => compareVndAmounts(row.amount, top) > 0 ? row.amount : top, "1");
  return <section className="card chart-card min-w-0 space-y-5"><div className="chart-heading"><div><p className="eyebrow">SO SÁNH</p><h2 className="section-title mt-2">{title}</h2></div></div>
    {visible.length === 0 ? <p className="muted">Chưa có dữ liệu trong khoảng thời gian đã chọn.</p> : <div className="space-y-3" role="list" aria-label={title}>
      {visible.map((row, index) => <div role="listitem" key={`${row.label}-${index}`}>
        <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{row.label}</span><strong className="shrink-0 tabular-nums">{money ? formatVND(row.amount) : Number(row.amount).toLocaleString("vi-VN")}</strong></div>
        <div className="chart-bar-track mt-2"><div className="chart-bar-fill h-full rounded-full" style={{ width: `${chartFraction(row.amount, max) * 100}%` }} /></div>
      </div>)}
    </div>}
  </section>;
}
