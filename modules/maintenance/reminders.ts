import { prisma } from "@/lib/prisma";
import { todayVN } from "@/lib/finance";
import { reminderStatus, documentReminderKey, documentReminderTransition } from "@/lib/reminder-rules";

/** Safe to retry: one reminder per schedule and per document expiry version. */
export async function refreshReminders(today = todayVN()) {
  const [schedules, documents] = await Promise.all([
    prisma.maintenanceSchedule.findMany({ where: { active: true, vehicle: { status: { not: "ARCHIVED" } } }, include: { vehicle: { select: { odometer: true } } } }),
    prisma.vehicleDocument.findMany({ where: { expiresAt: { not: null }, vehicle: { status: { not: "ARCHIVED" } } }, include: { vehicle: { select: { odometer: true } } } })
  ]);
  let changed = 0;
  for (const schedule of schedules) {
    const status = reminderStatus({ today, dueDate: schedule.dueDate?.toISOString().slice(0, 10), dueOdometer: schedule.dueOdometer, currentOdometer: schedule.vehicle.odometer, warningDays: schedule.warningDays, warningKm: schedule.warningKm });
    if (!status) {
      // A corrected odometer or a postponed due date must clear stale warnings.
      await prisma.reminder.updateMany({ where: { organizationId: schedule.organizationId, sourceKey: `schedule:${schedule.id}`, status: { not: "RESOLVED" } }, data: { status: "RESOLVED" } });
      continue;
    }
    await prisma.reminder.upsert({ where: { organizationId_sourceKey: { organizationId: schedule.organizationId, sourceKey: `schedule:${schedule.id}` } }, create: { organizationId: schedule.organizationId, vehicleId: schedule.vehicleId, sourceKey: `schedule:${schedule.id}`, title: schedule.title, status, dueDate: schedule.dueDate, dueOdometer: schedule.dueOdometer }, update: { status, title: schedule.title, dueDate: schedule.dueDate, dueOdometer: schedule.dueOdometer } });
    changed++;
  }
  // Completing a schedule or archiving a vehicle also clears its existing alarm.
  await prisma.$executeRaw`UPDATE "Reminder" r SET "status" = 'RESOLVED', "updatedAt" = NOW() FROM "MaintenanceSchedule" s JOIN "Vehicle" v ON v."id" = s."vehicleId" WHERE r."organizationId" = s."organizationId" AND r."sourceKey" = CONCAT('schedule:', s."id") AND (NOT s."active" OR v."status" = 'ARCHIVED') AND r."status" <> 'RESOLVED'`;
  // Keep a renewal reminder until the user explicitly closes it, but never
  // continue alarming for a vehicle that is no longer in operation.
  await prisma.$executeRaw`UPDATE "Reminder" r SET "status" = 'RESOLVED', "updatedAt" = NOW() FROM "VehicleDocument" d JOIN "Vehicle" v ON v."id" = d."vehicleId" WHERE r."organizationId" = d."organizationId" AND r."sourceKey" LIKE CONCAT('document:', d."id", ':%') AND v."status" = 'ARCHIVED' AND r."status" <> 'RESOLVED'`;
  for (const doc of documents) {
    const expiry = doc.expiresAt!.toISOString().slice(0, 10);
    const status = reminderStatus({ today, dueDate: expiry, currentOdometer: doc.vehicle.odometer, warningDays: 30, warningKm: 0 });
    if (!status) continue;
    const sourceKey = documentReminderKey(doc.id, expiry);
    // Keep a manually resolved reminder closed, but advance active reminders
    // from UPCOMING to DUE/OVERDUE as the date passes. A new expiry has a new key.
    await prisma.reminder.upsert({ where: { organizationId_sourceKey: { organizationId: doc.organizationId, sourceKey } }, create: { organizationId: doc.organizationId, vehicleId: doc.vehicleId, sourceKey, title: `${doc.kind} · ${doc.documentNumber ?? "Giấy tờ"}`, status, dueDate: doc.expiresAt }, update: { title: `${doc.kind} · ${doc.documentNumber ?? "Giấy tờ"}`, dueDate: doc.expiresAt } });
    const transition = documentReminderTransition(status);
    await prisma.reminder.updateMany({ where: { organizationId: doc.organizationId, sourceKey, ...transition.where }, data: transition.data });
    changed++;
  }
  return { schedules: schedules.length, documents: documents.length, evaluated: changed };
}
