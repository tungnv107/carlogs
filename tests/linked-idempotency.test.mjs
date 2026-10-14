import test from 'node:test';
import assert from 'node:assert/strict';
import { sameFuelSubmission, sameMaintenanceSubmission } from '../lib/linked-idempotency.ts';

const datetime = new Date('2026-10-13T05:30:00Z');
const fuel = {
  createdById: 'user-1', vehicleId: 'vehicle-1', categoryId: 'category-1',
  occurredAt: datetime, amount: '150000', odometer: 12345,
  unit: 'LITER', quantity: '25', unitPrice: '6000',
  isFullTank: true, vendor: 'Fuel station'
};
const savedFuel = {
  ...fuel, status: 'POSTED',
  fuelLog: {
    createdById: fuel.createdById, vehicleId: fuel.vehicleId,
    occurredAt: datetime, odometer: fuel.odometer, unit: fuel.unit,
    quantity: fuel.quantity, unitPrice: fuel.unitPrice,
    isFullTank: fuel.isFullTank, vendor: fuel.vendor
  }
};

test('fuel idempotency accepts exact replay, rejects changes to every key business field', () => {
  assert.equal(sameFuelSubmission(savedFuel, fuel), true);
  for (const [key, value] of Object.entries({
    createdById: 'user-2', vehicleId: 'vehicle-2', categoryId: 'category-2',
    occurredAt: new Date('2026-10-13T06:30:00Z'), amount: '250000',
    odometer: 12346, unit: 'KWH', quantity: '24', unitPrice: '6100',
    isFullTank: false, vendor: 'Another station'
  })) {
    assert.equal(sameFuelSubmission(savedFuel, { ...fuel, [key]: value }), false, `change to ${key} must be rejected`);
  }
  assert.equal(sameFuelSubmission({ ...savedFuel, status: 'VOID' }, fuel), false);
  assert.equal(sameFuelSubmission({ ...savedFuel, fuelLog: null }, fuel), false);
  assert.equal(sameFuelSubmission({ ...savedFuel, fuelLog: { ...savedFuel.fuelLog, createdById: 'user-3' } }, fuel), false);
});

const maintenance = {
  createdById: 'user-1', vehicleId: 'vehicle-1', kind: 'MAINTENANCE',
  occurredAt: datetime, odometer: 12345, description: 'Changed oil',
  vendor: 'Garage', amount: '150000'
};
const savedMaintenance = {
  ...maintenance,
  expense: { createdById: 'user-1', vehicleId: 'vehicle-1', status: 'POSTED', amount: '150000' }
};

test('maintenance idempotency handles paid/free work and refuses mutated payload', () => {
  assert.equal(sameMaintenanceSubmission(savedMaintenance, maintenance), true);
  for (const [key, value] of Object.entries({
    createdById: 'user-2', vehicleId: 'vehicle-2', kind: 'REPAIR',
    occurredAt: new Date('2026-10-13T06:30:00Z'), odometer: 12346,
    description: 'Different work', vendor: 'Another garage', amount: '100000'
  })) {
    assert.equal(sameMaintenanceSubmission(savedMaintenance, { ...maintenance, [key]: value }), false, `change to ${key} must be rejected`);
  }
  assert.equal(sameMaintenanceSubmission({ ...savedMaintenance, expense: { ...savedMaintenance.expense, status: 'VOID' } }, maintenance), false);
  assert.equal(sameMaintenanceSubmission({ ...savedMaintenance, expense: null }, maintenance), false);
  assert.equal(sameMaintenanceSubmission({ ...savedMaintenance, expense: null }, { ...maintenance, amount: '0' }), true);
});
