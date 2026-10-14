import { z } from "zod";
import { amountSchema, dateSchema } from "@/lib/finance";

export const expenseSchema = z.object({
  vehicleId: z.string().min(1, "Chọn xe."),
  categoryId: z.string().min(1, "Chọn danh mục."),
  date: dateSchema,
  amount: amountSchema,
  idempotencyKey: z.string().uuid(),
  odometer: z.union([z.literal(""), z.coerce.number().int().min(0).max(1000000000)]).optional(),
  vendor: z.string().trim().max(150).optional(),
  description: z.string().trim().max(2000).optional(),
  paymentMethod: z.string().trim().max(100).optional()
});
