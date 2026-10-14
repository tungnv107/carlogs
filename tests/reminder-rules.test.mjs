import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderStatus, documentReminderKey, documentReminderTransition } from '../lib/reminder-rules.ts';

const base = { today: '2026-10-13', currentOdometer: 2000, warningDays: 30, warningKm: 100 };
test('reminder date thresholds and year boundary', () => {
  assert.equal(reminderStatus({ ...base, dueDate: '2026-11-13' }), null);
  assert.equal(reminderStatus({ ...base, dueDate: '2026-11-12' }), 'UPCOMING');
  assert.equal(reminderStatus({ ...base, dueDate: '2026-10-13' }), 'DUE');
  assert.equal(reminderStatus({ ...base, dueDate: '2026-10-12' }), 'OVERDUE');
  assert.equal(reminderStatus({ ...base, today: '2026-12-31', dueDate: '2027-01-01' }), 'UPCOMING');
});

test('odometer threshold, precedence with date, and no-due state', () => {
  assert.equal(reminderStatus({ ...base, dueOdometer: 2100 }), 'UPCOMING');
  assert.equal(reminderStatus({ ...base, dueOdometer: 2000 }), 'DUE');
  assert.equal(reminderStatus({ ...base, dueOdometer: 1900 }), 'DUE');
  assert.equal(reminderStatus({ ...base, dueDate: '2026-10-12', dueOdometer: 9000 }), 'OVERDUE');
  assert.equal(reminderStatus(base), null);
});

test('document reminders advance over time, remain closed when resolved and are retry-safe', () => {
  const expiry = '2026-10-13';
  const today = ['2026-10-01', '2026-10-13', '2026-10-14'];
  const expected = ['UPCOMING', 'DUE', 'OVERDUE'];
  let current = null;
  for (let i = 0; i < today.length; i++) {
    const next = reminderStatus({ ...base, today: today[i], dueDate: expiry });
    assert.equal(next, expected[i]);
    const change = documentReminderTransition(next);
    if (current === null || !change.where.status.notIn.includes(current)) current = change.data.status;
    assert.equal(current, expected[i]);
    assert.ok(change.where.status.notIn.includes(current)); // retry causes no status change
  }
  current = 'RESOLVED';
  const overdue = documentReminderTransition('OVERDUE');
  assert.equal(overdue.where.status.notIn.includes(current), true);
  assert.equal(documentReminderKey('doc1', '2026-10-13'), 'document:doc1:2026-10-13');
  assert.notEqual(documentReminderKey('doc1', '2026-10-13'), documentReminderKey('doc1', '2027-10-13'));
});
