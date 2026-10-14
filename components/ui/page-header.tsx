import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-heading flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0 space-y-2">{eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>{description && <p className="muted max-w-2xl">{description}</p>}
    </div>{action && <div className="flex w-full shrink-0 sm:w-auto">{action}</div>}
  </header>;
}

export function StatCard({ label, value, detail, tone = "default" }: { label: string; value: string; detail?: string; tone?: "default" | "hero" }) {
  return <section className={tone === "hero" ? "card metric-card metric-hero relative isolate overflow-hidden" : "card metric-card"}>
    {tone === "hero" && <><div aria-hidden className="metric-glow pointer-events-none absolute -right-14 -top-28 h-64 w-64 rounded-full"/><div aria-hidden className="metric-orbit pointer-events-none absolute -right-14 top-4 h-52 w-52 rounded-full"/></>}
    <div className="relative flex items-center justify-between gap-3"><p className={tone === "hero" ? "text-xs font-semibold text-blue-100" : "stat-label"}>{label}</p><span className="metric-spark" aria-hidden/></div>
    <p className="stat-number money relative mt-4">{value}</p>{detail && <p className={tone === "hero" ? "relative mt-3 text-xs leading-relaxed text-blue-100" : "muted mt-3"}>{detail}</p>}
  </section>;
}
