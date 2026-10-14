/** A schedule can only be completed by an explicitly selected, scoped work record. */
export function eligibleMaintenanceWork(
  schedule: { organizationId: string; vehicleId: string; createdAt: Date; active: boolean },
  work: { organizationId: string; vehicleId: string; occurredAt: Date; id: string },
  selectedId: string
): boolean {
  return schedule.active && selectedId.length > 0 && work.id === selectedId &&
    schedule.organizationId === work.organizationId && schedule.vehicleId === work.vehicleId &&
    Number.isFinite(work.occurredAt.getTime()) && work.occurredAt >= schedule.createdAt;
}
