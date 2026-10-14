import test from 'node:test';
import assert from 'node:assert/strict';
import { canCreateExpense, canModifyExpense, expenseScope, vehicleScope } from '../lib/access-scope.ts';
import { sameExpenseSubmission } from '../lib/expense-idempotency.ts';

test('tài xế chỉ xem xe được giao và giao dịch gắn với xe đó', () => {
  assert.deepEqual(vehicleScope('DRIVER', 'user-a'), { assignedToId: 'user-a' });
  assert.deepEqual(expenseScope('DRIVER', 'user-a'), { vehicle: { assignedToId: 'user-a' } });
  for (const role of ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER']) {
    assert.deepEqual(vehicleScope(role, 'user-a'), {});
    assert.deepEqual(expenseScope(role, 'user-a'), {});
  }
});

test('ma trận quyền tạo, sửa/hủy chi phí', () => {
  assert.equal(canCreateExpense('VIEWER'), false);
  for (const role of ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'DRIVER']) {
    assert.equal(canCreateExpense(role), true);
  }
  assert.equal(canModifyExpense('DRIVER', 'user-a', 'user-a', 'user-a'), true);
  assert.equal(canModifyExpense('DRIVER', 'user-a', 'user-b', 'user-a'), false);
  assert.equal(canModifyExpense('DRIVER', 'user-a', 'user-a', 'user-b'), false);
  assert.equal(canModifyExpense('DRIVER', 'user-a', 'user-a', null), false);
  assert.equal(canModifyExpense('VIEWER', 'user-a', 'user-a', 'user-a'), false);
  assert.equal(canModifyExpense('ACCOUNTANT', 'user-a', 'user-b', null), true);
});

test('gửi lại cùng khóa chỉ hợp lệ nếu payload bất biến', () => {
  const persisted = {
    createdById: 'user-a', vehicleId: 'vehicle-a', categoryId: 'category-a',
    occurredAt: new Date('2026-10-12T17:00:00.000Z'), amount: { toString: () => '150000' },
    odometer: null, vendor: null, description: 'Xăng', paymentMethod: null
  };
  const incoming = {
    createdById: 'user-a', vehicleId: 'vehicle-a', categoryId: 'category-a',
    occurredAt: new Date('2026-10-12T17:00:00.000Z'), amount: '150000',
    odometer: '', description: 'Xăng'
  };
  assert.equal(sameExpenseSubmission(persisted, incoming), true);
  for (const changed of [
    { amount: '250000' }, { vehicleId: 'vehicle-b' }, { categoryId: 'category-b' },
    { createdById: 'user-b' }, { odometer: 200 }, { vendor: 'Garage X' },
    { description: 'Gửi xe' }, { paymentMethod: 'CASH' },
    { occurredAt: new Date('2026-10-13T17:00:00.000Z') }
  ]) {
    assert.equal(sameExpenseSubmission(persisted, { ...incoming, ...changed }), false, JSON.stringify(changed));
  }
});
