// Generazione server-side del PDF del rendiconto mensile (pdfkit, nessun browser headless).
// Lingue EN/IT/HE (HE impaginato da destra a sinistra). Il PDF riporta un codice di integrità
// HMAC calcolato sui dati: permette di verificare che il documento non sia stato alterato.
// NOTA: non è una firma digitale qualificata (vedi README, "lacune note").
import PDFDocument from 'pdfkit';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pdfRuns } from '../bidi';
import { fill, langMeta, type Dict, type Locale } from '../../i18n';
import { ils, date as fmtDate, monthLong } from '../format';

export interface StatementPdfData {
  id: string;
  period: string; // YYYY-MM-01
  published_at: string | null;
  owner: { id: string; full_name: string };
  lines: { line_date: string; category: string; description: string; amount_ils: number; property?: { code: string; name: string } | null }[];
}

const FONT_DIR = join(process.cwd(), 'node_modules/@fontsource/heebo/files');
let fonts: Record<string, Buffer> | null = null;
function loadFonts() {
  if (!fonts) {
    fonts = {
      lat: readFileSync(join(FONT_DIR, 'heebo-latin-400-normal.woff')),
      latB: readFileSync(join(FONT_DIR, 'heebo-latin-700-normal.woff')),
      he: readFileSync(join(FONT_DIR, 'heebo-hebrew-400-normal.woff')),
      heB: readFileSync(join(FONT_DIR, 'heebo-hebrew-700-normal.woff')),
    };
  }
  return fonts;
}

export function integrityCode(d: StatementPdfData, secret: string): string {
  const canonical = JSON.stringify({
    id: d.id, owner: d.owner.id, period: d.period,
    lines: d.lines.map((l) => [l.line_date, l.category, Number(l.amount_ils).toFixed(2)]),
  });
  const h = createHmac('sha256', secret).update(canonical).digest('hex').slice(0, 20).toUpperCase();
  return h.match(/.{4}/g)!.join('-');
}

export function totals(lines: StatementPdfData['lines']) {
  const inc = lines.filter((l) => l.amount_ils > 0).reduce((a, l) => a + Number(l.amount_ils), 0);
  const exp = lines.filter((l) => l.amount_ils < 0).reduce((a, l) => a + Number(l.amount_ils), 0);
  return { inc, exp, net: inc + exp };
}

export async function renderStatementPdf(d: StatementPdfData, lang: Locale, t: Dict, secret: string): Promise<Buffer> {
  const f = loadFonts();
  const rtl = langMeta[lang].dir === 'rtl';
  const intl = langMeta[lang].intl;
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, info: { Title: `${t.st.pdfTitle} ${d.period.slice(0, 7)}`, Author: 'Easy Bayit Property Management Ltd', Creator: 'Easybayit Portal' } });
  doc.registerFont('lat', f.lat); doc.registerFont('latB', f.latB); doc.registerFont('he', f.he); doc.registerFont('heB', f.heB);
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))));

  const W = doc.page.width, M = 50, inner = W - 2 * M;

  // Disegna testo misto con ordine visuale corretto; align relativo al box [x, x+w]
  const text = (s: string, x: number, y: number, w: number, o: { size?: number; bold?: boolean; align?: 'start' | 'end' | 'center'; color?: string } = {}) => {
    const size = o.size ?? 10;
    let str = s;
    const measure = (v: string) => pdfRuns(v, rtl).reduce((a, r) => a + doc.font(o.bold ? r.font + 'B' : r.font).fontSize(size).widthOfString(r.text), 0);
    while (measure(str) > w && str.length > 1) str = str.slice(0, -2) + '…';
    const runs = pdfRuns(str, rtl);
    const total = measure(str);
    const align = o.align ?? 'start';
    // "start" = sinistra in LTR, destra in RTL
    let cx = align === 'center' ? x + (w - total) / 2 : (align === 'start') !== rtl ? x : x + w - total;
    doc.fillColor(o.color ?? '#0b1324');
    for (const r of runs) {
      const fn = o.bold ? r.font + 'B' : r.font;
      doc.font(fn).fontSize(size).text(r.text, cx, y, { lineBreak: false });
      cx += doc.widthOfString(r.text);
    }
  };
  // posizione x di una colonna (specchiata in RTL)
  const colX = (start: number, width: number) => (rtl ? M + inner - start - width : M + start);

  // --- Intestazione ---
  const logoX = rtl ? W - M - 34 : M;
  doc.roundedRect(logoX, 44, 34, 34, 8).fill('#1a4fd6');
  doc.save().translate(logoX, 44).scale(34 / 64)
    .path('M16 30 32 17l16 13v17a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z').lineWidth(4).strokeColor('#ffffff').stroke()
    .path('m25 37 5 5 10-10').lineWidth(4).strokeColor('#5eead4').stroke().restore();
  const brandX = rtl ? M : M + 44;
  text('Easybayit', brandX, 46, inner - 44, { size: 16, bold: true, color: '#1a4fd6' });
  text(t.meta.company, brandX, 66, inner - 44, { size: 8, color: '#526075' });

  text(t.st.pdfTitle, M, 100, inner, { size: 20, bold: true });
  text(monthLong(d.period, intl), M, 126, inner, { size: 12, color: '#334155' });

  // --- Dati proprietario ---
  doc.moveTo(M, 150).lineTo(W - M, 150).lineWidth(1).strokeColor('#e2e8f0').stroke();
  text(`${t.st.pdfOwner}: ${d.owner.full_name}`, M, 160, inner, { size: 10 });
  if (d.published_at) text(fill(t.st.published, { d: fmtDate(d.published_at, intl) }), M, 175, inner, { size: 9, color: '#526075' });

  // --- Riepilogo ---
  const tt = totals(d.lines);
  const boxes = [
    { label: t.st.income, v: tt.inc, bg: '#f6f8fc' },
    { label: t.st.expenses, v: tt.exp, bg: '#f6f8fc' },
    { label: t.st.net, v: tt.net, bg: '#eef3ff' },
  ];
  const bw = (inner - 20) / 3;
  boxes.forEach((b, i) => {
    const bx = colX(i * (bw + 10), bw);
    doc.roundedRect(bx, 198, bw, 52, 6).fill(b.bg);
    text(b.label, bx + 10, 206, bw - 20, { size: 8, color: '#526075' });
    text(ils(b.v, intl), bx + 10, 222, bw - 20, { size: 14, bold: true, color: i === 2 ? '#1a4fd6' : '#0b1324' });
  });

  // --- Tabella voci ---
  const cols = [
    { key: 'date', label: t.common.date, start: 0, width: 70 },
    { key: 'item', label: t.st.item, start: 72, width: 190 },
    { key: 'prop', label: t.common.property, start: 264, width: 140 },
    { key: 'amount', label: t.common.amount, start: 406, width: inner - 406 },
  ];
  let y = 272;
  const header = () => {
    doc.rect(M, y, inner, 22).fill('#f6f8fc');
    for (const c of cols) text(c.label, colX(c.start, c.width) + 4, y + 6, c.width - 8, { size: 8, bold: true, color: '#526075', align: c.key === 'amount' ? 'end' : 'start' });
    y += 26;
  };
  header();
  const sorted = [...d.lines].sort((a, b) => a.line_date.localeCompare(b.line_date));
  for (const l of sorted) {
    if (y > doc.page.height - 120) { doc.addPage(); y = 60; header(); }
    const label = (t.categories as Record<string, string>)[l.category] ?? l.category;
    const item = l.description ? `${label} · ${l.description}` : label;
    const vals: Record<string, string> = {
      date: fmtDate(l.line_date, intl, { day: '2-digit', month: '2-digit', year: 'numeric' }),
      item, prop: l.property ? `${l.property.code} · ${l.property.name}` : '—', amount: ils(l.amount_ils, intl),
    };
    for (const c of cols) {
      text(vals[c.key], colX(c.start, c.width) + 4, y, c.width - 8, {
        size: 9, align: c.key === 'amount' ? 'end' : 'start', color: c.key === 'amount' && l.amount_ils > 0 ? '#15803d' : '#0b1324',
      });
    }
    y += 16;
    doc.moveTo(M, y - 4).lineTo(W - M, y - 4).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
  }
  y += 4;
  doc.rect(M, y, inner, 24).fill('#eef3ff');
  text(t.st.net, colX(0, 300) + 4, y + 7, 292, { size: 10, bold: true });
  text(ils(tt.net, intl), colX(cols[3].start, cols[3].width) + 4, y + 7, cols[3].width - 8, { size: 10, bold: true, align: 'end', color: '#1a4fd6' });

  // --- Piè di pagina su ogni pagina ---
  const code = integrityCode(d, secret);
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.page.margins.bottom = 0; // evita che pdfkit aggiunga pagine scrivendo nel piè di pagina
    const fy = doc.page.height - 70;
    doc.moveTo(M, fy).lineTo(W - M, fy).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
    text(t.st.pdfFooter, M, fy + 8, inner, { size: 7.5, color: '#526075' });
    text(`${t.st.pdfIntegrity}: ${code} · ${fill(t.st.pdfGenerated, { d: fmtDate(new Date().toISOString(), intl) })} · ID ${d.id.slice(0, 8)}`, M, fy + 20, inner, { size: 7.5, color: '#526075' });
    text(fill(t.st.pdfPage, { n: i + 1, t: range.count }), M, fy + 32, inner, { size: 7.5, color: '#526075', align: 'end' });
  }
  doc.end();
  return done;
}
