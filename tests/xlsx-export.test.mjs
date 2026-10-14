import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import { writeXLSX } from '../lib/xlsx-export.ts';

function unzipEntries(buffer) {
  let cursor = 0;
  const entries = new Map();
  while (buffer.readUInt32LE(cursor) === 0x04034b50) {
    const length = buffer.readUInt16LE(cursor + 26);
    const extras = buffer.readUInt16LE(cursor + 28);
    const size = buffer.readUInt32LE(cursor + 18);
    const name = buffer.subarray(cursor + 30, cursor + 30 + length).toString('utf8');
    const dataStart = cursor + 30 + length + extras;
    const inflated = inflateRawSync(buffer.subarray(dataStart, dataStart + size));
    assert.equal(inflated.length, buffer.readUInt32LE(cursor + 22));
    entries.set(name, inflated.toString('utf8'));
    cursor = dataStart + size;
  }
  assert.equal(buffer.readUInt32LE(cursor), 0x02014b50);
  return entries;
}

test('Excel OOXML is a valid ZIP with Vietnamese text, numeric VND and inert formulas', () => {
  const workbook = writeXLSX({
    title: 'BÁO CÁO CHI PHÍ',
    subtitle: 'Kỳ 2026-10-01 – 2026-10-13',
    headers: ['Biển số', 'Nội dung', 'Số tiền (VND)'],
    rows: [['30A-123.45', '=HYPERLINK("https://invalid.example", "open")', '150000'], ['51B-987.65', 'Bảo dưỡng & sửa chữa', '250000']],
    total: '400000'
  });
  const parts = unzipEntries(workbook);
  assert.equal(parts.size, 6);
  const sheet = parts.get('xl/worksheets/sheet1.xml');
  assert.match(sheet, /BÁO CÁO CHI PHÍ/);
  assert.match(sheet, /Bảo dưỡng &amp; sửa chữa/);
  assert.match(sheet, /<c r="C5" s="3"><v>150000<\/v><\/c>/);
  assert.match(sheet, /<c r="C7" s="3"><v>400000<\/v><\/c>/);
  assert.match(sheet, /&apos;=HYPERLINK/);
  assert.doesNotMatch(sheet, /<f>/);
  assert.match(parts.get('xl/styles.xml'), /VND/);
});

test('Excel rejects shape mismatches and non-integer totals', () => {
  const payload = { title: 'A', subtitle: 'B', headers: ['C', 'D'], rows: [['x', '1']], total: '1' };
  assert.throws(() => writeXLSX({ ...payload, total: '-20' }));
  assert.throws(() => writeXLSX({ ...payload, rows: [['x']] }));
});
