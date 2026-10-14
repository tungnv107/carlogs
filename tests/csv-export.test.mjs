import test from 'node:test';
import assert from 'node:assert/strict';
import { writeCSV } from '../lib/csv-export.ts';

test('CSV giữ tiếng Việt, VND nguyên, escape dấu nháy và chặn spreadsheet formula', () => {
  const csv = writeCSV([['Biển số', 'Mô tả', 'Số tiền (VND)'], ['30A-123.45', '=HYPERLINK("https://example.invalid", "click")', '150000'], ['51B-999.00', 'Bảo dưỡng, thay "dầu"', '999999999999999']]);
  assert.ok(csv.startsWith('\ufeff'));
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example.invalid""/);
  assert.match(csv, /"Bảo dưỡng, thay ""dầu"""/);
  assert.match(csv, /"999999999999999"/);
  assert.match(csv, /\r\n/);
});
