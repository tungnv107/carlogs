import { z } from "zod";
import { normalizePlate } from "@/lib/business-rules";
export { normalizePlate } from "@/lib/business-rules";

export const vehicleSchema = z.object({
  plate: z.string().trim().min(4).max(20).transform(normalizePlate)
    .refine((value) => /^[A-Z0-9]{4,15}$/.test(value), "Biển số không hợp lệ."),
  name: z.string().trim().min(2, "Cần nhập tên xe.").max(100),
  type: z.enum(["CAR", "MOTORBIKE", "TRUCK", "OTHER"]),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "OTHER"]),
  brand: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  color: z.string().trim().max(50).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  assignedToId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "PAUSED", "ARCHIVED"]),
  odometer: z.coerce.number().int().min(0).max(1000000000),
  notes: z.string().trim().max(2000).optional()
});
