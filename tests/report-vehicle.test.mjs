import test from 'node:test';
import assert from 'node:assert/strict';
import { vehicleCostPerKm } from '../lib/report-vehicle.ts';

test('per-vehicle cost/km rounds VND with Decimal and returns N/A without real km', () => {
  assert.equal(vehicleCostPerKm('100000000000001', 3), '33333333333334');
  assert.equal(vehicleCostPerKm('123', 2), '62');
  assert.equal(vehicleCostPerKm('0', 12), '0');
  assert.equal(vehicleCostPerKm('100', null), null);
  assert.equal(vehicleCostPerKm('100', 0), null);
  assert.equal(vehicleCostPerKm('100', -1), null);
  assert.equal(vehicleCostPerKm('100', 1.5), null);
});
