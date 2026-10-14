/** Shared business rules with no third-party runtime dependencies. */
export function normalizePlate(raw: string): string {
  return raw.normalize("NFKC").toUpperCase().replace(/[\s.\-]/g, "");
}

export function vnDateToUTC(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Ngày phải có định dạng YYYY-MM-DD.");
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime()) || new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date) !== value) throw new Error("Ngày không tồn tại.");
  return date;
}

export function todayVN(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(now);
}

export function formatVND(value: string | number | bigint): string {
  return `${BigInt(value).toLocaleString("vi-VN")} ₫`;
}
