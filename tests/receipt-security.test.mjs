import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareReceipt } from '../lib/receipts.ts';

test('chứng từ chỉ nhận nội dung khớp MIME đã khai báo', async () => {
  const jpeg = new File([Buffer.from([0xff, 0xd8, 0xff, 0x00])], 'fuel.jpg', { type: 'image/jpeg' });
  const prepared = await prepareReceipt(jpeg);
  assert.equal(prepared.mimeType, 'image/jpeg');
  assert.equal(prepared.size, 4);
  assert.ok(prepared.objectKey);

  const fake = new File([Buffer.from('%PDF-1.7')], 'fake.jpg', { type: 'image/jpeg' });
  await assert.rejects(prepareReceipt(fake), /không đúng định dạng/);
  const invalidMime = new File(['hello'], 'note.txt', { type: 'text/plain' });
  await assert.rejects(prepareReceipt(invalidMime), /Chỉ hỗ trợ/);
});

test('chặn tệp vượt giới hạn trước khi ghi vào storage', async () => {
  const oversized = new File([Buffer.alloc(5 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' });
  await assert.rejects(prepareReceipt(oversized), /vượt quá 5 MB/);
  assert.equal(await prepareReceipt(null), null);
});
