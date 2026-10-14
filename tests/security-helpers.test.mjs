import test from 'node:test';
import assert from 'node:assert/strict';
import { safeCallbackPath } from '../lib/navigation.ts';
import { invitationToken, invitationTokenHash, normalizedEmail, validInvitationToken } from '../lib/invitations.ts';

test('OAuth callback chỉ nhận đường dẫn invitation nội bộ hợp lệ', () => {
  const path = `/invite/${'a'.repeat(64)}`;
  assert.equal(safeCallbackPath(path), path);
  for (const bad of ['https://evil.example', '//evil.example', '/\\evil', '/invite/abc', '/api/auth/signout', '/invite/' + 'a'.repeat(64) + '?next=https://evil.example']) {
    assert.equal(safeCallbackPath(bad), '/dashboard');
  }
});

test('Lời mời chỉ lưu hash của token ngẫu nhiên; email được chuẩn hóa', () => {
  const token = invitationToken();
  assert.ok(validInvitationToken(token));
  assert.equal(token.length, 64);
  assert.ok(/^[a-f0-9]{64}$/.test(invitationTokenHash(token)));
  assert.notEqual(invitationTokenHash(token), token);
  assert.notEqual(invitationToken(), token);
  assert.equal(normalizedEmail(' User.Name@Example.Com '), 'user.name@example.com');
  assert.equal(validInvitationToken('bad-token'), false);
});
