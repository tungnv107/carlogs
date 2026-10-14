import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlate, vnDateToUTC, todayVN, formatVND } from '../lib/business-rules.ts';
import { withoutOAuthSecrets } from '../lib/auth-account.ts';

test('biển số chuẩn hóa nhất quán', () => {
  assert.equal(normalizePlate('30a-123.45'), '30A12345');
  assert.equal(normalizePlate(' 29 b 001 22 '), '29B00122');
});

test('ngày nghiệp vụ Việt Nam bắt đầu lúc 17:00 UTC ngày hôm trước', () => {
  assert.equal(vnDateToUTC('2026-10-13').toISOString(), '2026-10-12T17:00:00.000Z');
  assert.equal(todayVN(new Date('2026-10-12T18:00:00Z')), '2026-10-13');
  assert.throws(() => vnDateToUTC('2026-02-30'));
  assert.throws(() => vnDateToUTC('2026/10/13'));
});

test('VND nguyên lớn không mất precision', () => {
  assert.equal(formatVND('9007199254740993'), '9.007.199.254.740.993 ₫');
  assert.equal(formatVND(150000), '150.000 ₫');
});

test('ranh giới ngày Việt Nam và nhuận năm', () => {
  const start = vnDateToUTC('2026-12-31');
  const end = vnDateToUTC('2027-01-01');
  assert.equal(end.getTime() - start.getTime(), 86_400_000);
  assert.equal(start.toISOString(), '2026-12-30T17:00:00.000Z');
  assert.equal(vnDateToUTC('2024-02-29').toISOString(), '2024-02-28T17:00:00.000Z');
  assert.throws(() => vnDateToUTC('2025-02-29'));
  assert.throws(() => vnDateToUTC('2026-13-01'));
});

test('Google OAuth không lưu access/refresh/ID token vào tài khoản DB', () => {
  const original = {
    provider: 'google', providerAccountId: 'google-sub-123',
    access_token: 'secret-access', refresh_token: 'secret-refresh',
    id_token: 'secret-id', session_state: 'opaque', type: 'oidc'
  };
  const saved = withoutOAuthSecrets(original);
  assert.deepEqual(saved, { provider: 'google', providerAccountId: 'google-sub-123', type: 'oidc' });
  assert.equal(original.access_token, 'secret-access');
});
