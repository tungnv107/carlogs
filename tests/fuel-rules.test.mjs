import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { allowedEnergyUnit, fuelAmountVND } from '../lib/fuel-rules.ts';

test('lít và kWh được kiểm tra theo loại xe, không hoán đổi', () => {
  for (const type of ['PETROL', 'DIESEL']) {
    assert.equal(allowedEnergyUnit(type, 'LITER'), true);
    assert.equal(allowedEnergyUnit(type, 'KWH'), false);
  }
  assert.equal(allowedEnergyUnit('ELECTRIC', 'KWH'), true);
  assert.equal(allowedEnergyUnit('ELECTRIC', 'LITER'), false);
  assert.equal(allowedEnergyUnit('HYBRID', 'LITER'), true);
  assert.equal(allowedEnergyUnit('HYBRID', 'KWH'), true);
});

test('giá xăng và giá điện nhân Decimal chính xác, làm tròn VND một lần', () => {
  const dec = value => new Prisma.Decimal(value);
  assert.equal(fuelAmountVND(dec('20.500'), dec('23500')).toString(), '481750');
  assert.equal(fuelAmountVND(dec('12.345'), dec('2345.678')).toString(), '28957');
  assert.equal(fuelAmountVND(dec('0.001'), dec('500.000')).toString(), '1');
  assert.equal(fuelAmountVND(dec('0.001'), dec('499.999')).toString(), '0');
});
