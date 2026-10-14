import { Prisma, type EnergyUnit, type FuelType } from "@prisma/client";

/** Keep liters and kWh separate; mixed/hybrid vehicles may record either. */
export function allowedEnergyUnit(fuelType: FuelType, unit: EnergyUnit): boolean {
  if (fuelType === "ELECTRIC") return unit === "KWH";
  if (fuelType === "PETROL" || fuelType === "DIESEL") return unit === "LITER";
  return true;
}

/** Precise monetary rounding once, after multiplying exact decimal inputs. */
export function fuelAmountVND(quantity: Prisma.Decimal, unitPrice: Prisma.Decimal): Prisma.Decimal {
  return quantity.mul(unitPrice).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
}
