import { timingSafeEqual } from "node:crypto";
import { refreshReminders } from "@/modules/maintenance/reminders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.REMINDER_JOB_SECRET;
  if (!secret || secret.length < 32) return Response.json({ error: "Job secret chưa được cấu hình." }, { status: 503 });
  const provided = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try { return Response.json(await refreshReminders()); }
  catch (error) { console.error(JSON.stringify({ event: "reminder_job_failed", message: error instanceof Error ? error.message : "unknown" })); return Response.json({ error: "Reminder job failed" }, { status: 500 }); }
}
