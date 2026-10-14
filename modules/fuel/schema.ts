import { z } from "zod";
import { vnLocalDateTime } from "@/lib/operations-rules";

const decimal = z.string().regex(/^\d{1,12}(\.\d{1,3})?$/, "Số lượng/đơn giá tối đa 3 chữ số thập phân.");
export const fuelSchema = z.object({
  vehicleId: z.string().min(1),
  occurredAt: z.string().refine(value => { try { vnLocalDateTime(value); return true; } catch { return false; } }, "Ngày giờ không hợp lệ."),
  odometer: z.coerce.number().int().min(0).max(1_000_000_000),
  unit: z.enum(["LITER", "KWH"]),
  quantity: decimal.refine(value => Number(value) > 0, "Số lượng phải lớn hơn 0."),
  unitPrice: decimal.refine(value => Number(value) >= 0, "Đơn giá không hợp lệ."),
  isFullTank: z.boolean(),
  vendor: z.string().trim().max(150),
  idempotencyKey: z.string().uuid()
});
