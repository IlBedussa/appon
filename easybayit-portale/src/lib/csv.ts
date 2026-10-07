// Parser CSV minimale (RFC 4180: virgolette, virgole e a capo nei campi) per l'import dei pagamenti.
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  const s = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',' || c === ';') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows.map((r) => r.map((x) => x.trim()));
}

/** Righe -> oggetti usando la prima riga come intestazione (minuscolo). */
export function csvObjects(input: string): Record<string, string>[] {
  const [head, ...rest] = parseCsv(input);
  if (!head) return [];
  const keys = head.map((h) => h.toLowerCase());
  return rest.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}

/** Neutralizza formule quando un valore viene esportato in CSV (CSV injection). */
export const csvSafe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
