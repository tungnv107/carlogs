/** Report amounts are whole VND represented as strings. Compare without float precision loss. */
export function compareVndAmounts(a: string, b: string): number {
  const left = BigInt(a);
  const right = BigInt(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

/** A bounded fraction for drawing charts. The original VND totals stay as exact strings. */
export function chartFraction(amount: string, total: string): number {
  const whole = BigInt(total);
  if (whole <= 0n) return 0;
  const part = BigInt(amount);
  if (part <= 0n) return 0;
  if (part >= whole) return 1;
  return Number((part * 1_000_000n + whole / 2n) / whole) / 1_000_000;
}

/** One decimal place, rounded from integers (0.05% rounds up). */
export function formatSharePercent(amount: string, total: string): string {
  const whole = BigInt(total);
  if (whole <= 0n) return "0.0";
  const part = BigInt(amount);
  if (part <= 0n) return "0.0";
  const bounded = part > whole ? whole : part;
  const tenths = (bounded * 1_000n + whole / 2n) / whole;
  return `${tenths / 10n}.${tenths % 10n}`;
}
