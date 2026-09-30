/**
 * RFC 4180 CSV with spreadsheet formula-injection protection: cells that start
 * with = + - @ (or tab/CR) get a leading apostrophe so Excel/Sheets treat
 * them as text, not formulas.
 */
export function toCsv(rows: Record<string, unknown>[], columns: string[]) {
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\r\n") + "\r\n";
}
