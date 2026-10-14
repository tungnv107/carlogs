/** The same submission key may be replayed only for the same ledger entry.
 * Comparing canonical persisted fields protects against silent data loss when a
 * user reuses a form key after changing the form.
 */
export function sameExpenseSubmission(
  saved: {
    createdById: string;
    vehicleId: string;
    categoryId: string;
    occurredAt: Date;
    amount: { toString(): string };
    odometer: number | null;
    vendor: string | null;
    description: string | null;
    paymentMethod: string | null;
  },
  submitted: {
    createdById: string;
    vehicleId: string;
    categoryId: string;
    occurredAt: Date;
    amount: string;
    odometer?: number | "";
    vendor?: string;
    description?: string;
    paymentMethod?: string;
  }
): boolean {
  return saved.createdById === submitted.createdById
    && saved.vehicleId === submitted.vehicleId
    && saved.categoryId === submitted.categoryId
    && saved.occurredAt.getTime() === submitted.occurredAt.getTime()
    && saved.amount.toString() === submitted.amount
    && saved.odometer === (submitted.odometer === "" ? null : submitted.odometer ?? null)
    && (saved.vendor ?? "") === (submitted.vendor ?? "")
    && (saved.description ?? "") === (submitted.description ?? "")
    && (saved.paymentMethod ?? "") === (submitted.paymentMethod ?? "");
}
