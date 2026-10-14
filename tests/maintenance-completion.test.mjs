import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleMaintenanceWork } from '../lib/maintenance-completion.ts';

test('completing scheduled service requires an explicitly selected later work on the same scoped vehicle', () => {
  const schedule = { organizationId: 'org1', vehicleId: 'car1', active: true, createdAt: new Date('2026-10-10T08:00:00Z') };
  const work = { organizationId: 'org1', vehicleId: 'car1', id: 'work2', occurredAt: new Date('2026-10-12T08:00:00Z') };
  assert.equal(eligibleMaintenanceWork(schedule, work, 'work2'), true);
  assert.equal(eligibleMaintenanceWork(schedule, work, 'work1'), false);
  assert.equal(eligibleMaintenanceWork(schedule, { ...work, organizationId: 'org2' }, 'work2'), false);
  assert.equal(eligibleMaintenanceWork(schedule, { ...work, vehicleId: 'car2' }, 'work2'), false);
  assert.equal(eligibleMaintenanceWork(schedule, { ...work, occurredAt: new Date('2026-10-09T08:00:00Z') }, 'work2'), false);
  assert.equal(eligibleMaintenanceWork({ ...schedule, active: false }, work, 'work2'), false);
});
