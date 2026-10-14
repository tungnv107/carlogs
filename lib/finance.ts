import { z } from "zod";
import { vnDateToUTC } from "@/lib/business-rules";
export { vnDateToUTC, todayVN, formatVND } from "@/lib/business-rules";

// Store whole VND only; accepting digits prevents float imprecision and rounding surprises.
export const amountSchema = z.string().regex(/^[1-9]\d{0,14}$/, "Nhập số tiền VND nguyên, lớn hơn 0.");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ.").refine((value) => {
  try { vnDateToUTC(value); return true; } catch { return false; }
}, "Ngày không hợp lệ.");
