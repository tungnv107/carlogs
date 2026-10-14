/** UTF-8 Excel-compatible CSV with formula injection protection. */
export function writeCSV(rows: (string | number | null)[][]): string {
  const escaped = rows.map(row => row.map(value => {
    let text = String(value ?? "");
    if (/^\s*[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  return `\ufeff${escaped}\r\n`;
}
