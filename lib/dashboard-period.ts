import { reportPeriod } from "./report-period.ts";
import { todayVN } from "./business-rules.ts";

export type DashboardPeriod = "month" | "quarter" | "year" | "custom";

/** Resolve a user-facing period to the business dates shared with reporting. */
export function resolveDashboardPeriod(selection: { period?: string; from?: string; to?: string }, today = todayVN()) {
  const period: DashboardPeriod = ["month", "quarter", "year", "custom"].includes(selection.period ?? "")
    ? selection.period as DashboardPeriod : "month";
  const year = today.slice(0, 4);
  const month = Number(today.slice(5, 7));
  const quarterStart = String(Math.floor((month - 1) / 3) * 3 + 1).padStart(2, "0");
  const from = period === "custom" ? selection.from ?? `${today.slice(0, 7)}-01`
    : period === "year" ? `${year}-01-01`
    : period === "quarter" ? `${year}-${quarterStart}-01`
    : `${today.slice(0, 7)}-01`;
  const to = period === "custom" ? selection.to ?? today : today;
  return { period, ...reportPeriod(from, to) };
}
