import test from 'node:test';
import assert from 'node:assert/strict';
import { reportPeriod, tripWithinReportPeriod, tripWithinRange, periodChange, safeReportPage, boundedReportPage } from '../lib/report-period.ts';

test('inclusive Vietnam dates use exclusive UTC end across year boundary', () => {
  const range = reportPeriod('2026-12-31', '2027-01-01');
  assert.equal(range.start.toISOString(), '2026-12-30T17:00:00.000Z');
  assert.equal(range.endExclusive.toISOString(), '2027-01-01T17:00:00.000Z');
  assert.equal(range.previousStart.toISOString(), '2026-12-28T17:00:00.000Z');
  assert.equal(range.previousEndExclusive.toISOString(), range.start.toISOString());
});
test('invalid ranges, zero denominator and unsafe paging', () => {
  assert.throws(() => reportPeriod('2026-12-30', '2026-12-29'));
  assert.throws(() => reportPeriod('2025-01-01', '2026-12-31'));
  assert.equal(periodChange('100', '0'), null);
  assert.equal(periodChange('150', '100'), 50);
  assert.equal(safeReportPage('-1'), 1);
  assert.equal(safeReportPage('3'), 3);
  assert.equal(safeReportPage('1.5'), 1);
  assert.equal(safeReportPage('Infinity'), 1);
});

test('trip history uses the same fully-contained rule with optional filters', () => {
  const from = new Date('2026-09-30T17:00:00.000Z');
  const to = new Date('2026-10-31T17:00:00.000Z');
  assert.deepEqual(tripWithinRange(from, to), { startedAt: { gte: from }, endedAt: { lt: to } });
  assert.deepEqual(tripWithinRange(undefined, to), { endedAt: { lt: to } });
  assert.deepEqual(tripWithinRange(from), { startedAt: { gte: from } });
  assert.deepEqual(tripWithinRange(), {});
});

test('trip denominator excludes journeys crossing either report boundary', () => {
  const period = reportPeriod('2026-01-31', '2026-02-01');
  const bounds = tripWithinReportPeriod(period);
  const eligible = (start, end) => new Date(start) >= bounds.startedAt.gte && new Date(end) < bounds.endedAt.lt;
  assert.equal(eligible('2026-01-30T17:00:00Z', '2026-02-01T16:59:59Z'), true);
  assert.equal(eligible('2026-01-30T16:59:59Z', '2026-01-30T18:00:00Z'), false);
  assert.equal(eligible('2026-02-01T16:00:00Z', '2026-02-01T17:00:00Z'), false);
  assert.equal(eligible('2026-01-31T16:59:00Z', '2026-01-31T17:01:00Z'), true);
});

test('server pagination clamps to existing pages for filtered datasets', () => {
  assert.equal(boundedReportPage(undefined, 0, 15), 1);
  assert.equal(boundedReportPage('12', 16, 15), 2);
  assert.equal(boundedReportPage('2', 30, 15), 2);
  assert.equal(boundedReportPage('-1', 30, 15), 1);
  assert.equal(boundedReportPage('1.5', 30, 15), 1);
  assert.equal(boundedReportPage('Infinity', 30, 15), 1);
  assert.equal(boundedReportPage('9999999999999999999999', 30, 15), 1);
  for (const [total, size] of [[-1, 15], [1.5, 15], [Infinity, 15], [5, 0], [5, -1], [5, 1.1]]) {
    assert.throws(() => boundedReportPage('1', total, size), /pagination bounds/);
  }
});
