import test from 'node:test';
import assert from 'node:assert/strict';
import { consumptionPer100Km, distanceFromTrips, overlappingTrip, overlappingOdometer, vnLocalDateTime } from '../lib/operations-rules.ts';

const fill = (odometer, quantity, isFullTank = true, unit = 'LITER', posted = true) => ({ odometer, quantity, isFullTank, unit, posted });

test('full-to-full totals intermediate fills, excludes initial fill', () => {
  assert.ok(Math.abs(consumptionPer100Km([fill(1000, 50), fill(1200, 10, false), fill(1500, 25)], 'LITER') - 7) < 1e-9);
  assert.ok(Math.abs(consumptionPer100Km([fill(1000, 30), fill(1200, 10, true), fill(1500, 24)], 'LITER') - 6.8) < 1e-9);
});

test('missing anchors, invalid km, zero distance and mixed energy never generate consumption', () => {
  assert.equal(consumptionPer100Km([fill(1200, 12)], 'LITER'), null);
  assert.equal(consumptionPer100Km([fill(1000, 30), fill(1000, 20)], 'LITER'), null);
  assert.equal(consumptionPer100Km([fill(1000, 30), fill(1200, 22, true, 'KWH'), fill(1500, 20)], 'LITER'), null);
  assert.equal(consumptionPer100Km([fill(1000, 30), fill(1200, 20, true, 'LITER', false), fill(1500, 20)], 'LITER'), null);
  assert.equal(consumptionPer100Km([fill(1000, 30), fill(900, 20), fill(1100, 20)], 'LITER'), 10);
});

test('trip distances and overlap use explicit data', () => {
  assert.equal(distanceFromTrips([]), null);
  assert.equal(distanceFromTrips([10, 15, 0]), 25);
  assert.equal(distanceFromTrips([10, -1]), null);
  assert.equal(overlappingOdometer(100, 200, 200, 300), false);
  assert.equal(overlappingOdometer(100, 200, 150, 250), true);
  assert.equal(overlappingTrip(new Date('2026-10-13T01:00Z'), new Date('2026-10-13T02:00Z'), new Date('2026-10-13T02:00Z'), new Date('2026-10-13T03:00Z')), false);
});

test('Vietnam local datetime refuses invalid calendar/time', () => {
  assert.equal(vnLocalDateTime('2026-10-13T12:45').toISOString(), '2026-10-13T05:45:00.000Z');
  assert.throws(() => vnLocalDateTime('2026-02-30T12:00'));
  assert.throws(() => vnLocalDateTime('2026-10-13T25:00'));
});
