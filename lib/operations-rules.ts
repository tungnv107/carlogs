/** Business-time inputs use Vietnam local time, without relying on server timezone. */
export function vnLocalDateTime(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Ngày giờ không hợp lệ.");
  const result = new Date(`${value}:00+07:00`);
  if (Number.isNaN(result.getTime())) throw new Error("Ngày giờ không hợp lệ.");
  const formatted = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(result).replace(" ", "T");
  if (formatted !== value) throw new Error("Ngày giờ không tồn tại.");
  return result;
}

export function overlappingTrip(start: Date, end: Date, otherStart: Date, otherEnd: Date): boolean {
  return start < otherEnd && end > otherStart;
}

export function overlappingOdometer(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

export type ConsumptionLog = { odometer: number; quantity: string | number; unit: "LITER" | "KWH"; isFullTank: boolean; posted: boolean };

/** A valid pair of full fills bounds a cycle; intermediate fills count, the initial fill does not. */
export function consumptionPer100Km(logs: ConsumptionLog[], unit: "LITER" | "KWH"): number | null {
  // This metric requires the full-to-full method, recorded in chronological order.
  // Intervening fills of another energy type invalidate the cycle.
  let anchor: ConsumptionLog | null = null;
  let previousOdometer: number | null = null;
  let cycleQuantity = 0;
  let totalQuantity = 0;
  let totalDistance = 0;
  for (const item of logs) {
    const quantity = Number(item.quantity);
    if (!item.posted || item.unit !== unit || !Number.isSafeInteger(item.odometer) || item.odometer < 0 || !Number.isFinite(quantity) || quantity <= 0) {
      anchor = null; previousOdometer = null; cycleQuantity = 0;
      continue;
    }
    if (previousOdometer !== null && item.odometer <= previousOdometer) {
      anchor = null; cycleQuantity = 0;
    }
    if (anchor) cycleQuantity += quantity;
    if (item.isFullTank) {
      if (anchor && item.odometer > anchor.odometer) {
        totalDistance += item.odometer - anchor.odometer;
        totalQuantity += cycleQuantity;
      }
      anchor = item;
      cycleQuantity = 0;
    }
    previousOdometer = item.odometer;
  }
  return totalDistance > 0 && Number.isFinite(totalQuantity) && totalQuantity > 0 ? totalQuantity / totalDistance * 100 : null;
}

/** Null conveys missing trip coverage; no odometer-based guess is made. */
export function distanceFromTrips(distances: number[]): number | null {
  if (!distances.length || distances.some(value => !Number.isSafeInteger(value) || value < 0)) return null;
  return distances.reduce((sum, value) => sum + value, 0);
}
