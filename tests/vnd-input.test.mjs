import test from 'node:test';
import assert from 'node:assert/strict';
import { formatVndDigits, normalizeVndDigits, vndCaretPosition } from '../lib/vnd-input.ts';

test('Vietnamese amount input submits exact ungrouped VND with 15-digit limit', () => {
  assert.equal(normalizeVndDigits('000150.000 đ'), '150000');
  assert.equal(normalizeVndDigits('123456789012345678'), '123456789012345');
  assert.equal(normalizeVndDigits('0'), '0');
  assert.equal(formatVndDigits('123456789012345'), '123.456.789.012.345');
});

test('caret stays by the edited digit, including insertion in the middle', () => {
  assert.equal(vndCaretPosition('1234', 1, '1234'), 1);
  assert.equal(vndCaretPosition('1234', 2, '1234'), 3);
  assert.equal(vndCaretPosition('19.234', 2, '19234'), 2);
  assert.equal(vndCaretPosition('12.345', 6, '12345'), 6);
  assert.equal(vndCaretPosition('0001234', 7, '1234'), 5);
});
