import { vnDateToUTC } from "./business-rules.ts";

export type ReportPeriod = { from: string; to: string; start: Date; endExclusive: Date; previousStart: Date; previousEndExclusive: Date };

/** Count only trips fully contained by the requested business-date range. */
export function tripWithinReportPeriod(period: Pick<ReportPeriod, "start" | "endExclusive">) {
  return tripWithinRange(period.start, period.endExclusive);
}

/** Support open-ended date filters while counting only completely included trips. */
export function tripWithinRange(start?: Date, endExclusive?: Date) {
  return {
    ...(start ? { startedAt: { gte: start } } : {}),
    ...(endExclusive ? { endedAt: { lt: endExclusive } } : {})
  };
}

/** Inclusive business dates, exclusive UTC upper boundary, fixed Vietnam UTC+7. */
export function reportPeriod(from: string, to: string): ReportPeriod {
  const start = vnDateToUTC(from);
  const endDate = vnDateToUTC(to);
  if (start > endDate) throw new Error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
  const endExclusive = new Date(endDate.getTime() + 86_400_000);
  const span = endExclusive.getTime() - start.getTime();
  if (span > 366 * 86_400_000) throw new Error("Khoảng báo cáo tối đa 366 ngày.");
  return { from, to, start, endExclusive, previousStart: new Date(start.getTime() - span), previousEndExclusive: start };
}

/** A zero prior period is not a basis for a meaningful percentage change. */
export function periodChange(current: string, previous: string): number | null {
  const prior = Number(previous);
  if (!Number.isFinite(prior) || prior <= 0) return null;
  const recent = Number(current);
  if (!Number.isFinite(recent)) return null;
  return (recent - prior) / prior * 100;
}

export function safeReportPage(input: string | undefined): number {
  const page = Number(input);
  return Number.isSafeInteger(page) && page > 0 && page < 100_000 ? page : 1;
}

/** Clamp a requested page to the last existing page after filtering. */
export function boundedReportPage(input: string | undefined, total: number, size: number): number {
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(size) || size <= 0) {
    throw new Error("Invalid pagination bounds.");
  }
  return Math.min(safeReportPage(input), Math.max(1, Math.ceil(total / size)));
}
