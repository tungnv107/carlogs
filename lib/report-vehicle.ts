import { Prisma } from "@prisma/client";

/** Return N/A for absent distance. Keep VND math in Decimal until rounded once. */
export function vehicleCostPerKm(amount: string, distance: number | null): string | null {
  if (distance === null || !Number.isSafeInteger(distance) || distance <= 0) return null;
  return new Prisma.Decimal(amount).div(distance).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toString();
}
