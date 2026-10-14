import test from 'node:test';
import assert from 'node:assert/strict';
import { previewFuelAmountVND } from '../lib/fuel-preview.ts';

test('fuel preview uses exact decimal multiplication and half-up rounding', () => {
  assert.equal(previewFuelAmountVND('12.345', '25000.5'), '308631');
  assert.equal(previewFuelAmountVND('1', '0.5'), '1');
  assert.equal(previewFuelAmountVND('0.001', '500'), '1');
  assert.equal(previewFuelAmountVND('999999999999', '1000'), '999999999999000');
});

test('fuel preview does not invent a total for incomplete or invalid input', () => {
  assert.equal(previewFuelAmountVND('', '25000'), null);
  assert.equal(previewFuelAmountVND('1.2345', '25000'), null);
  assert.equal(previewFuelAmountVND('0', '25000'), null);
  assert.equal(previewFuelAmountVND('1', '-200'), null);
  assert.equal(previewFuelAmountVND('0.001', '0.001'), null);
  assert.equal(previewFuelAmountVND('999999999999', '1001'), null);
  assert.equal(previewFuelAmountVND('999999999999', '999999999999'), null);
});
