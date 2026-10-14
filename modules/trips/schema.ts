import { z } from "zod";
import { vnLocalDateTime } from "@/lib/operations-rules";

const time = z.string().refine((value) => { try { vnLocalDateTime(value); return true; } catch { return false; } }, "Ngày giờ không hợp lệ.");
export const tripSchema = z.object({
  vehicleId: z.string().min(1), driverId: z.string().optional(), startedAt: time, endedAt: time,
  odometerStart: z.coerce.number().int().min(0).max(1_000_000_000),
  odometerEnd: z.coerce.number().int().min(0).max(1_000_000_000),
  purpose: z.string().trim().max(300), notes: z.string().trim().max(2000)
}).refine((value) => value.odometerEnd >= value.odometerStart, { message: "Km cuối phải lớn hơn hoặc bằng km đầu." })
  .refine((value) => vnLocalDateTime(value.endedAt) > vnLocalDateTime(value.startedAt), { message: "Giờ kết thúc phải sau giờ bắt đầu." });

export const odometerCorrectionSchema = z.object({
  vehicleId: z.string().min(1), adjustedValue: z.coerce.number().int().min(0).max(1_000_000_000),
  reason: z.string().trim().min(10, "Nêu lý do điều chỉnh ít nhất 10 ký tự.").max(1000)
});
