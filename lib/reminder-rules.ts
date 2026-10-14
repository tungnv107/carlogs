export type DueStatus = "UPCOMING" | "DUE" | "OVERDUE" | null;

/** Only move active document alarms; retries and manually closed alarms are inert. */
export function documentReminderTransition(status: Exclude<DueStatus, null>) {
  return { where: { status: { notIn: ["RESOLVED", status] as Array<"RESOLVED" | Exclude<DueStatus, null>> } }, data: { status } };
}

/** A renewed expiry generates a distinct alarm, leaving the former version auditable. */
export function documentReminderKey(documentId: string, expiry: string) {
  return `document:${documentId}:${expiry}`;
}

/** Compare calendar dates in Vietnam without depending on the server timezone. */
export function reminderStatus(input: {
  today: string; dueDate?: string | null; dueOdometer?: number | null;
  currentOdometer: number; warningDays: number; warningKm: number;
}): DueStatus {
  let upcoming = false;
  let due = false;
  if (input.dueDate) {
    const days = Math.round((Date.parse(`${input.dueDate}T00:00:00Z`) - Date.parse(`${input.today}T00:00:00Z`)) / 86_400_000);
    if (days < 0) return "OVERDUE";
    if (days === 0) due = true;
    else if (days <= input.warningDays) upcoming = true;
  }
  if (input.dueOdometer !== null && input.dueOdometer !== undefined) {
    if (input.currentOdometer >= input.dueOdometer) due = true;
    else if (input.currentOdometer >= input.dueOdometer - input.warningKm) upcoming = true;
  }
  return due ? "DUE" : upcoming ? "UPCOMING" : null;
}
