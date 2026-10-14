import test from 'node:test';
import assert from 'node:assert/strict';
import { chartFraction, compareVndAmounts, formatSharePercent } from '../lib/report-share.ts';

test('report shares keep very large VND exact', () => {
  const high = '9007199254740993';
  const low = '9007199254740992';
  const total = '18014398509481985';
  assert.equal(compareVndAmounts(high, low), 1);
  assert.equal(compareVndAmounts(low, high), -1);
  assert.equal(compareVndAmounts(high, high), 0);
  assert.equal(formatSharePercent(high, total), '50.0');
  assert.equal(formatSharePercent(low, total), '50.0');
  assert.ok(chartFraction(high, total) > 0);
  assert.ok(chartFraction(high, total) <= 1);
});

test('report shares handle zero, tiny fractions and one-decimal rounding', () => {
  assert.equal(formatSharePercent('100', '0'), '0.0');
  assert.equal(formatSharePercent('1', '1000'), '0.1');
  assert.equal(formatSharePercent('1', '2000'), '0.1');
  assert.equal(formatSharePercent('1', '10000'), '0.0');
  assert.equal(formatSharePercent('999', '1000'), '99.9');
  assert.equal(formatSharePercent('500', '500'), '100.0');
  assert.equal(chartFraction('0', '0'), 0);
  assert.equal(chartFraction('500', '500'), 1);
});
