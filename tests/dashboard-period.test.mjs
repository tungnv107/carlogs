import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDashboardPeriod } from '../lib/dashboard-period.ts';

test('dashboard presets use Vietnam business dates and report boundaries', () => {
  const today = '2026-10-13';
  assert.deepEqual([resolveDashboardPeriod({}, today).from, resolveDashboardPeriod({}, today).to], ['2026-10-01', today]);
  assert.equal(resolveDashboardPeriod({ period: 'quarter' }, today).from, '2026-10-01');
  assert.equal(resolveDashboardPeriod({ period: 'year' }, today).from, '2026-01-01');
  assert.equal(resolveDashboardPeriod({ period: 'invalid' }, today).period, 'month');
  assert.equal(resolveDashboardPeriod({ period: 'quarter' }, '2026-05-04').from, '2026-04-01');
});

test('custom dashboard periods reject invalid dates and ranges', () => {
  const today = '2026-10-13';
  const custom = resolveDashboardPeriod({ period: 'custom', from: '2026-09-01', to: '2026-09-30' }, today);
  assert.equal(custom.start.toISOString(), '2026-08-31T17:00:00.000Z');
  assert.equal(custom.endExclusive.toISOString(), '2026-09-30T17:00:00.000Z');
  assert.throws(() => resolveDashboardPeriod({ period: 'custom', from: '2026-11-02', to: '2026-11-01' }, today));
  assert.throws(() => resolveDashboardPeriod({ period: 'custom', from: '2025-01-01', to: '2026-10-13' }, today));
  assert.throws(() => resolveDashboardPeriod({ period: 'custom', from: '2026-02-30', to: '2026-03-01' }, today));
});
