/** The form submits plain integer digits; grouping is presentation only. */
export function normalizeVndDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 15).replace(/^0+(?=\d)/, "");
}

export function formatVndDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Put the caret after the same significant digit when grouping dots shift. */
export function vndCaretPosition(rawValue: string, rawCaret: number, digits: string): number {
  const ungrouped = rawValue.replace(/\D/g, "").slice(0, 15);
  const removedLeadingZeros = ungrouped.length - digits.length;
  const prefixCount = rawValue.slice(0, rawCaret).replace(/\D/g, "").length;
  const digitCount = Math.min(digits.length, Math.max(0, prefixCount - removedLeadingZeros));
  if (!digitCount) return 0;
  const formatted = formatVndDigits(digits);
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (/\d/.test(formatted[index])) seen++;
    if (seen === digitCount) return index + 1;
  }
  return formatted.length;
}
