/** A repeated linked transaction must contain the same business data and actor.
 * Values passed here are already canonicalized by the caller (Decimal/UTC).
 */
type Money = { toString(): string };

export type FuelSubmission = {
  createdById: string; vehicleId: string; categoryId: string;
  occurredAt: Date; amount: Money; odometer: number;
  unit: "LITER" | "KWH"; quantity: Money; unitPrice: Money;
  isFullTank: boolean; vendor: string | null;
};

export function sameFuelSubmission(saved: {
  createdById: string; vehicleId: string; categoryId: string;
  occurredAt: Date; amount: Money; status: string;
  fuelLog: null | {
    createdById: string; vehicleId: string; occurredAt: Date;
    odometer: number; unit: "LITER" | "KWH";
    quantity: Money; unitPrice: Money; isFullTank: boolean; vendor: string | null;
  };
}, incoming: FuelSubmission): boolean {
  const log = saved.fuelLog;
  return saved.status === "POSTED" && log !== null
    && saved.createdById === incoming.createdById
    && saved.vehicleId === incoming.vehicleId && log.vehicleId === incoming.vehicleId
    && saved.categoryId === incoming.categoryId
    && saved.occurredAt.getTime() === incoming.occurredAt.getTime()
    && log.occurredAt.getTime() === incoming.occurredAt.getTime()
    && saved.amount.toString() === incoming.amount.toString()
    && log.createdById === incoming.createdById
    && log.odometer === incoming.odometer
    && log.unit === incoming.unit
    && log.quantity.toString() === incoming.quantity.toString()
    && log.unitPrice.toString() === incoming.unitPrice.toString()
    && log.isFullTank === incoming.isFullTank
    && (log.vendor ?? "") === (incoming.vendor ?? "");
}

export type MaintenanceSubmission = {
  createdById: string; vehicleId: string; kind: string;
  occurredAt: Date; odometer: number; description: string;
  vendor: string | null; amount: Money;
};

export function sameMaintenanceSubmission(saved: {
  createdById: string; vehicleId: string; kind: string;
  occurredAt: Date; odometer: number; description: string;
  vendor: string | null; expense: null | {
    createdById: string; vehicleId: string; status: string; amount: Money;
  };
}, incoming: MaintenanceSubmission): boolean {
  return saved.createdById === incoming.createdById
    && saved.vehicleId === incoming.vehicleId
    && saved.kind === incoming.kind
    && saved.occurredAt.getTime() === incoming.occurredAt.getTime()
    && saved.odometer === incoming.odometer
    && saved.description === incoming.description
    && (saved.vendor ?? "") === (incoming.vendor ?? "")
    && (saved.expense ? saved.expense.createdById === incoming.createdById
      && saved.expense.vehicleId === incoming.vehicleId
      && saved.expense.status === "POSTED"
      && saved.expense.amount.toString() === incoming.amount.toString()
      : incoming.amount.toString() === "0");
}
