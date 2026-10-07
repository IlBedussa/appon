// Strumenti comuni per i PDF del portale (pdfkit + Heebo, testo misto ebraico/latino, RTL).
// Usato dai report di ispezione e dal report mensile sullo stato dell'immobile.
// (Il rendiconto mensile in statement.ts mantiene il proprio codice, già testato.)
import PDFDocument from 'pdfkit';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pdfRuns } from '../bidi';
import { langMeta, type Locale } from '../../i18n';

const FONT_DIR = join(process.cwd(), 'node_modules/@fontsource/heebo/files');
let fonts: Record<string, Buffer> | null = null;
const loadFonts = () => (fonts ??= {
  lat: readFileSync(join(FONT_DIR, 'heebo-latin-400-normal.woff')),
  latB: readFileSync(join(FONT_DIR, 'heebo-latin-700-normal.woff')),
  he: readFileSync(join(FONT_DIR, 'heebo-hebrew-400-normal.woff')),
  heB: readFileSync(join(FONT_DIR, 'heebo-hebrew-700-normal.woff')),
});

export const C = { ink: '#0b1324', ink2: '#334155', muted: '#526075', line: '#e2e8f0', soft: '#f6f8fc', brand: '#1a4fd6', brandSoft: '#eef3ff', ok: '#15803d', okSoft: '#ecfdf3', warn: '#b45309', warnSoft: '#fff7ed', bad: '#b91c1c', badSoft: '#fef2f2' };
type TextOpts = { size?: number; bold?: boolean; align?: 'start' | 'end' | 'center'; color?: string };

/** Codice di integrità HMAC (non è una firma qualificata): 20 caratteri esadecimali a gruppi di 4. */
export function hmacCode(payload: unknown, secret: string): string {
  const h = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex').slice(0, 20).toUpperCase();
  return h.match(/.{4}/g)!.join('-');
}

export function createKit(lang: Locale, info: { Title: string }) {
  const f = loadFonts();
  const rtl = langMeta[lang].dir === 'rtl';
  const intl = langMeta[lang].intl;
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, info: { ...info, Author: 'Easy Bayit Property Management Ltd', Creator: 'Easybayit Portal' } });
  doc.registerFont('lat', f.lat); doc.registerFont('latB', f.latB); doc.registerFont('he', f.he); doc.registerFont('heB', f.heB);
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))));
  const W = doc.page.width, H = doc.page.height, M = 50, inner = W - 2 * M;
  const BOTTOM = H - 90; // spazio riservato al piè di pagina

  const measure = (s: string, size: number, bold?: boolean) =>
    pdfRuns(s, rtl).reduce((a, r) => a + doc.font(bold ? r.font + 'B' : r.font).fontSize(size).widthOfString(r.text), 0);

  /** Una riga di testo (troncata con … se non entra), ordine visuale corretto; align relativo a [x, x+w]. */
  const text = (s: string, x: number, y: number, w: number, o: TextOpts = {}) => {
    const size = o.size ?? 10;
    let str = s;
    while (measure(str, size, o.bold) > w && str.length > 1) str = str.slice(0, -2) + '…';
    const total = measure(str, size, o.bold);
    const align = o.align ?? 'start';
    let cx = align === 'center' ? x + (w - total) / 2 : (align === 'start') !== rtl ? x : x + w - total;
    doc.fillColor(o.color ?? C.ink);
    for (const r of pdfRuns(str, rtl)) {
      doc.font(o.bold ? r.font + 'B' : r.font).fontSize(size).text(r.text, cx, y, { lineBreak: false });
      cx += doc.widthOfString(r.text);
    }
  };

  /** Divide un paragrafo in righe che stanno in w (a capo sulle parole). */
  const wrap = (s: string, w: number, size: number, bold?: boolean): string[] => {
    const lines: string[] = [];
    for (const para of s.split(/\r?\n/)) {
      let cur = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const next = cur ? `${cur} ${word}` : word;
        if (measure(next, size, bold) <= w || !cur) cur = next; else { lines.push(cur); cur = word; }
      }
      lines.push(cur);
    }
    return lines;
  };

  /** Paragrafo a capo automatico; restituisce la nuova y. */
  const para = (s: string, x: number, y: number, w: number, o: TextOpts & { lh?: number } = {}) => {
    const size = o.size ?? 10, lh = o.lh ?? size * 1.45;
    for (const line of wrap(s, w, size, o.bold)) { text(line, x, y, w, o); y += lh; }
    return y;
  };

  /** x di una colonna (specchiata in RTL). */
  const colX = (start: number, width: number) => (rtl ? M + inner - start - width : M + start);

  /** Intestazione con logo e ragione sociale; restituisce la y sotto l'intestazione. */
  const header = (title: string, subtitle: string, company: string) => {
    const logoX = rtl ? W - M - 34 : M;
    doc.roundedRect(logoX, 44, 34, 34, 8).fill(C.brand);
    doc.save().translate(logoX, 44).scale(34 / 64)
      .path('M16 30 32 17l16 13v17a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z').lineWidth(4).strokeColor('#ffffff').stroke()
      .path('m25 37 5 5 10-10').lineWidth(4).strokeColor('#5eead4').stroke().restore();
    const brandX = rtl ? M : M + 44;
    text('Easybayit', brandX, 46, inner - 44, { size: 16, bold: true, color: C.brand });
    text(company, brandX, 66, inner - 44, { size: 8, color: C.muted });
    text(title, M, 100, inner, { size: 20, bold: true });
    text(subtitle, M, 126, inner, { size: 11, color: C.ink2 });
    doc.moveTo(M, 148).lineTo(W - M, 148).lineWidth(1).strokeColor(C.line).stroke();
    return 160;
  };

  /** Titolo di sezione con barra colorata; gestisce il salto pagina. */
  const section = (title: string, y: number, need = 60) => {
    if (y + need > BOTTOM) { doc.addPage(); y = 60; }
    doc.rect(rtl ? W - M - 3 : M, y, 3, 16).fill(C.brand);
    text(title, rtl ? M : M + 10, y + 1, inner - 10, { size: 12.5, bold: true });
    return y + 26;
  };

  /** Pastiglia colorata (stato); restituisce la larghezza. */
  const pill = (label: string, x: number, y: number, tone: 'ok' | 'warn' | 'bad' | 'neutral' | 'brand') => {
    const [bg, fg] = tone === 'ok' ? [C.okSoft, C.ok] : tone === 'warn' ? [C.warnSoft, C.warn] : tone === 'bad' ? [C.badSoft, C.bad] : tone === 'brand' ? [C.brandSoft, C.brand] : [C.soft, C.muted];
    const w = measure(label, 8, true) + 14;
    const px = rtl ? x - w : x;
    doc.roundedRect(px, y - 2, w, 14, 7).fill(bg);
    text(label, px + 7, y + 1, w - 14, { size: 8, bold: true, color: fg, align: 'center' });
    return w;
  };

  const ensure = (y: number, need: number) => (y + need > BOTTOM ? (doc.addPage(), 60) : y);

  /** Piè di pagina su ogni pagina (righe di testo + numero pagina). */
  const footer = (lines: string[], pageLabel: (n: number, t: number) => string) => {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0;
      const fy = H - 70;
      doc.moveTo(M, fy).lineTo(W - M, fy).lineWidth(0.5).strokeColor(C.line).stroke();
      lines.forEach((l, k) => text(l, M, fy + 8 + k * 12, inner, { size: 7.5, color: C.muted }));
      text(pageLabel(i + 1, range.count), M, fy + 8 + lines.length * 12, inner, { size: 7.5, color: C.muted, align: 'end' });
    }
  };

  return { doc, done, rtl, intl, W, H, M, inner, BOTTOM, text, para, wrap, measure, colX, header, section, pill, ensure, footer };
}
export type Kit = ReturnType<typeof createKit>;
