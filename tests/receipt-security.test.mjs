import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareReceipt } from '../lib/receipts.ts';
import sharp from 'sharp';

test('chứng từ chỉ nhận ảnh giải mã được, khớp MIME và loại bỏ dữ liệu đính kèm', async () => {
  const original = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  const jpeg = new File([original, Buffer.from('<script>unsafe</script>')], 'fuel.jpg', { type: 'image/jpeg' });
  const prepared = await prepareReceipt(jpeg);
  assert.equal(prepared.mimeType, 'image/jpeg');
  assert.equal((await sharp(prepared.data).metadata()).format, 'jpeg');
  assert.ok(!prepared.data.includes(Buffer.from('<script>')));
  assert.equal(prepared.size, prepared.data.length);
  assert.ok(prepared.objectKey);

  const incomplete = new File([Buffer.from([0xff, 0xd8, 0xff, 0x00])], 'broken.jpg', { type: 'image/jpeg' });
  await assert.rejects(prepareReceipt(incomplete), /Ảnh không hợp lệ/);
  const fake = new File([Buffer.from('%PDF-1.7')], 'fake.jpg', { type: 'image/jpeg' });
  await assert.rejects(prepareReceipt(fake), /không đúng định dạng/);
  const wrongFormat = new File([original], 'fake.png', { type: 'image/png' });
  await assert.rejects(prepareReceipt(wrongFormat), /không đúng định dạng/);
  const invalidMime = new File(['hello'], 'note.txt', { type: 'text/plain' });
  await assert.rejects(prepareReceipt(invalidMime), /Chỉ hỗ trợ/);
});

test('PDF thiếu cấu trúc hoặc có hành động nhúng không được nhận', async () => {
  const truncated = new File(['%PDF-1.7'], 'cut.pdf', { type: 'application/pdf' });
  await assert.rejects(prepareReceipt(truncated), /Tệp PDF không hợp lệ/);
  const minimal = '%PDF-1.7\n1 0 obj << /Root 2 0 R >> endobj\nstartxref\n0\n%%EOF\n';
  const ok = await prepareReceipt(new File([minimal], 'demo.pdf', { type: 'application/pdf' }));
  assert.equal(ok.mimeType, 'application/pdf');
  const unsafe = new File([minimal.replace('/Root', '/JavaScript /Root')], 'action.pdf', { type: 'application/pdf' });
  await assert.rejects(prepareReceipt(unsafe), /không an toàn/);
});

test('chặn tệp vượt giới hạn trước khi ghi vào storage', async () => {
  const oversized = new File([Buffer.alloc(5 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' });
  await assert.rejects(prepareReceipt(oversized), /vượt quá 5 MB/);
  assert.equal(await prepareReceipt(null), null);
});
