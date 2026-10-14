/** Match the server's three-decimal input validation and ROUND_HALF_UP VND. */
export function previewFuelAmountVND(quantity: string, unitPrice: string): string | null {
  const valid = /^\d{1,12}(\.\d{1,3})?$/;
  if (!valid.test(quantity) || !valid.test(unitPrice)) return null;
  const thousandths = (value: string): bigint => {
    const [integer, decimal = ""] = value.split(".");
    return BigInt(integer) * 1_000n + BigInt(decimal.padEnd(3, "0") || "0");
  };
  const units = thousandths(quantity);
  if (units <= 0n) return null;
  const amount = (units * thousandths(unitPrice) + 500_000n) / 1_000_000n;
  // Match the POSTED expense amount bounds enforced by the fuel server action.
  if (amount <= 0n || amount > 999_999_999_999_999n) return null;
  return amount.toString();
}
