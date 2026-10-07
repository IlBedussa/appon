// Genera i file di ESEMPIO del "Drive di gestione" e i report mensili scaricabili:
//   public/samples/drive/<id>.pdf + <id>-p<N>.jpg          (documenti di terzi, lingua originale EN/HE)
//   public/samples/drive/<lang>/<id>.pdf + -p<N>.jpg       (documenti Easybayit, 4 lingue)
//   public/samples/drive/<photo>.jpg + <photo>-thumb.jpg   (illustrazioni al posto delle foto, con data/ora)
//   public/downloads/health-report-example-<lang>.pdf      (report mensile di esempio)
// TUTTO è fittizio e porta la filigrana EXAMPLE / ESEMPIO / דוגמה / EXEMPLE.
// Uso: node scripts/trust/make-samples.mjs   (richiede Chrome: CHROME_PATH, default /usr/bin/google-chrome)
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { L } from './sample-i18n.mjs';

const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const OUT = 'public/samples/drive';
const TMP = '/tmp/easybayit-samples';
const LANGS = ['en', 'he', 'fr', 'it'];
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true }); mkdirSync('public/downloads', { recursive: true });
for (const l of LANGS) mkdirSync(join(OUT, l), { recursive: true });

const font = (f) => readFileSync(`node_modules/@fontsource/heebo/files/${f}`).toString('base64');
const FONTS = [['latin', 400], ['latin', 500], ['latin', 700], ['hebrew', 400], ['hebrew', 500], ['hebrew', 700]].map(([s, w]) =>
  `@font-face{font-family:Heebo;font-weight:${w};src:url(data:font/woff2;base64,${font(`heebo-${s}-${w}-normal.woff2`)}) format('woff2');${s === 'hebrew' ? 'unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F;' : ''}}`).join('');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const money = (v, intl = 'en-GB') => new Intl.NumberFormat(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const WM = 'EXAMPLE · ESEMPIO · דוגמה · EXEMPLE';

const CSS = `${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:0}
html,body{font-family:Heebo,Arial,sans-serif;color:#0b1324;font-size:10.5pt;line-height:1.45;background:#e5e7eb;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:210mm;height:297mm;background:#fff;overflow:hidden;padding:20mm 18mm 22mm;page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
.wm{position:absolute;inset:-40mm;display:flex;flex-direction:column;justify-content:space-around;align-items:center;transform:rotate(-28deg);pointer-events:none;z-index:5}
.wm span{font-size:30pt;font-weight:700;letter-spacing:.06em;color:rgba(217,119,6,.11);white-space:nowrap;direction:ltr}
.stamp{position:absolute;top:9mm;inset-inline-end:14mm;z-index:6;border:2.5px solid #d97706;color:#d97706;border-radius:6px;padding:2px 10px;font-weight:700;font-size:11pt;letter-spacing:.08em;transform:rotate(-4deg);direction:ltr;background:rgba(255,255,255,.85)}
.banner{position:absolute;bottom:8mm;left:18mm;right:18mm;z-index:6;text-align:center;font-size:7.5pt;color:#92400e;background:#fffbeb;border:1px solid #fcd9a8;border-radius:4px;padding:3px 6px}
h1{font-size:19pt;line-height:1.2;margin-bottom:2mm}
h2{font-size:12pt;margin:6mm 0 2.5mm}
h3{font-size:10.5pt;margin:4mm 0 2mm}
.muted{color:#526075}.small{font-size:8.5pt}.xs{font-size:7.5pt}
table{width:100%;border-collapse:collapse;font-size:9.5pt}
th{font-size:8pt;text-transform:uppercase;letter-spacing:.04em;color:#526075;text-align:start;padding:2mm 2mm;background:#f6f8fc;border-bottom:1px solid #e2e8f0}
td{padding:2mm;border-bottom:1px solid #eef2f8;vertical-align:top}
.num{text-align:end;white-space:nowrap;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}
.pos{color:#15803d}.neg{color:#0b1324}
.tot td{font-weight:700;background:#eef3ff;border-bottom:0}
.row{display:flex;gap:5mm}.col{flex:1}
.kv{display:grid;grid-template-columns:auto 1fr;gap:1mm 5mm;font-size:9.5pt}.kv dt{color:#526075}.kv dd{font-weight:500}
.box{border:1px solid #e2e8f0;border-radius:3mm;padding:3.5mm 4mm}
.sig{margin-top:10mm;display:flex;gap:10mm}.sig div{flex:1;border-top:1px solid #94a3b8;padding-top:2mm;font-size:8.5pt;color:#526075}
.sigline{font-family:'Brush Script MT',cursive;font-size:16pt;color:#1e3a8a;height:9mm}
.lh{display:flex;justify-content:space-between;align-items:flex-start;gap:6mm;padding-bottom:4mm;margin-bottom:6mm;border-bottom:3px solid var(--c,#1a4fd6)}
.lh .logo{display:flex;align-items:center;gap:3mm}
.lh .mark{width:12mm;height:12mm;border-radius:3mm;background:var(--c,#1a4fd6);color:#fff;display:grid;place-items:center;font-weight:700;font-size:13pt}
.lh .nm{font-weight:700;font-size:13pt;line-height:1.1}.lh .addr{font-size:7.5pt;color:#526075;text-align:end;line-height:1.5}
.he{direction:rtl;text-align:right;font-family:Heebo}
.bi{display:flex;justify-content:space-between;gap:6mm}.bi>*{flex:1}.bi .he{text-align:right}
.chip{display:inline-block;font-size:8pt;font-weight:700;padding:.5mm 2.5mm;border-radius:9mm;background:#ecfdf3;color:#15803d}
.chip.warn{background:#fffbeb;color:#92400e}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:4mm 0}
.kpi{background:#f6f8fc;border-radius:3mm;padding:3mm}.kpi b{display:block;font-size:14pt;margin-top:1mm;direction:ltr;unicode-bidi:isolate;text-align:start}.kpi.hl{background:#eef3ff}.kpi.hl b{color:#1a4fd6}
[dir=rtl] .kpi b{text-align:right}
.checks{list-style:none;display:grid;gap:1.6mm;font-size:9.5pt}.checks li{display:flex;gap:2mm;align-items:flex-start}
.dot{flex:none;width:4.2mm;height:4.2mm;border-radius:50%;background:#15803d;color:#fff;font-size:7pt;display:grid;place-items:center;margin-top:.6mm}.dot.warn{background:#d97706}
.photos{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}.photos figure{margin:0}.photos img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:2mm;display:block}
.photos figcaption{font-size:7.5pt;color:#526075;margin-top:1mm}
.photos3{grid-template-columns:repeat(3,1fr)}
.foot{position:absolute;bottom:15mm;left:18mm;right:18mm;display:flex;justify-content:space-between;font-size:7pt;color:#64748b;border-top:1px solid #e2e8f0;padding-top:1.5mm;z-index:4}
.cond-good{color:#15803d;font-weight:600}.cond-fair{color:#b45309;font-weight:600}.cond-poor{color:#b91c1c;font-weight:600}
.note{background:#f6f8fc;border-inline-start:3px solid #1a4fd6;padding:3mm 4mm;border-radius:2mm;font-size:9.5pt}
.ebhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:7mm}
.eblogo{display:flex;align-items:center;gap:3mm}.eblogo svg{width:11mm;height:11mm}.eblogo b{font-size:15pt;color:#1a4fd6;display:block;line-height:1}.eblogo small{font-size:7pt;color:#526075}
`;
const ebLogo = `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1a4fd6"/><path d="M16 30 32 17l16 13v17a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="m25 37 5 5 10-10" fill="none" stroke="#5eead4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const wm = `<div class="wm">${Array.from({ length: 9 }, () => `<span>${WM} · ${WM}</span>`).join('')}</div>`;
const page = (body, { banner = 'SAMPLE DOCUMENT — fictional property, people and companies. Not a real record. · מסמך לדוגמה — בדיוני', foot = '' } = {}) =>
  `<section class="page">${wm}<div class="stamp">EXAMPLE · ESEMPIO</div>${body}${foot ? `<div class="foot">${foot}</div>` : ''}<div class="banner">${esc(banner)}</div></section>`;
// Firma "a mano" stilizzata (SVG) al posto del testo: chiaramente grafica, nessun nome reale.
const scribble = (seed) => { let d = 'M4 26'; for (let i = 0; i < 7; i++) { const x = 14 + i * 16, y = 8 + ((seed * (i + 3)) % 22); d += ` Q${x - 6} ${y} ${x} ${26 - (i % 2) * 8}`; } return `<svg viewBox="0 0 130 36" width="130" height="34"><path d="${d}" fill="none" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round"/></svg>`; };
const doc = (pages, { lang = 'en', dir = 'ltr' } = {}) => `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${pages.join('').replace(/<div class="sigline">([^<]+)<\/div>/g, (_, n) => `<div class="sigline">${scribble(n.length + n.charCodeAt(0))}</div>`)}</body></html>`;

// ---------- Documenti di terzi (EN/HE) ----------
const letterhead = (name, he, addr, c, mark) => `<div class="lh" style="--c:${c}"><div class="logo"><div class="mark">${mark}</div><div><div class="nm">${esc(name)}</div><div class="he small muted">${esc(he)}</div></div></div><div class="addr">${addr}</div></div>`;
const PROP = 'Rehov HaDugma 12, Apt. 4, Jerusalem (fictional) · רחוב הדוגמה 12, דירה 4, ירושלים';
const C = {
  hA: ['Example Heating Ltd (fictional)', 'אקזמפל חימום בע״מ (בדיוני)', 'Co. no. 000000001 (example)<br>Industrial Zone, Example City<br>Tel. 000-000-0001', '#dc2626', 'EH'],
  hB: ['Sample Solar Services (fictional)', 'סמפל שירותי שמש (בדיוני)', 'Licensed dealer 000000002 (example)<br>Example City<br>Tel. 000-000-0002', '#ea580c', 'SS'],
  hC: ['Demo Boilers & Co. (fictional)', 'דמו דודים ושות׳ (בדיוני)', 'Co. no. 000000003 (example)<br>Example City<br>Tel. 000-000-0003', '#0891b2', 'DB'],
  lA: ['Example Plumbing Ltd (fictional)', 'אקזמפל אינסטלציה בע״מ (בדיוני)', 'Co. no. 000000004 (example)<br>Example City<br>Tel. 000-000-0004', '#2563eb', 'EP'],
  lB: ['Sample Pipes Co. (fictional)', 'סמפל צנרת (בדיוני)', 'Licensed dealer 000000005 (example)<br>Example City<br>Tel. 000-000-0005', '#16a34a', 'SP'],
  lC: ['Demo Fix Services (fictional)', 'דמו תיקונים (בדיוני)', 'Licensed dealer 000000006 (example)<br>Example City<br>Tel. 000-000-0006', '#7c3aed', 'DF'],
};
const itemsTable = (items, totalLabel = 'Total incl. VAT 18% · סה״כ כולל מע״מ') => {
  const total = items.reduce((a, i) => a + i[1], 0);
  return `<table><thead><tr><th>Description · תיאור</th><th class="num">₪</th></tr></thead><tbody>${items.map(([d, v]) => `<tr><td>${d}</td><td class="num">${money(v)}</td></tr>`).join('')}
  <tr><td class="muted">Subtotal before VAT · לפני מע״מ</td><td class="num muted">${money(total / 1.18)}</td></tr><tr><td class="muted">VAT 18% · מע״מ</td><td class="num muted">${money(total - total / 1.18)}</td></tr>
  <tr class="tot"><td>${totalLabel}</td><td class="num">${money(total)}</td></tr></tbody></table>`;
};
const quote = (co, no, date, job, items, terms) => doc([page(`${letterhead(...co)}
  <div class="bi"><div><h1>Price quote</h1><p class="muted">No. ${no} · ${date}</p></div><div class="he"><h1>הצעת מחיר</h1><p class="muted">מס׳ ${no}</p></div></div>
  <div class="box" style="margin:5mm 0"><dl class="kv"><dt>To · לכבוד</dt><dd>Easybayit, on behalf of the owner · בשם הבעלים</dd><dt>Property · נכס</dt><dd>${PROP}</dd><dt>Job · עבודה</dt><dd>${job}</dd></dl></div>
  ${itemsTable(items)}
  <h3>Terms · תנאים</h3><ul class="small" style="padding-inline-start:5mm;display:grid;gap:1mm">${terms.map((t) => `<li>${t}</li>`).join('')}</ul>
  <div class="sig"><div><div class="sigline">${co[0].split(' ')[0]}</div>Contractor signature · חתימת הספק</div><div><div class="sigline"></div>Valid 14 days · בתוקף 14 יום</div></div>`)]);
const invoice = (co, kind, no, date, items, extra = '') => doc([page(`${letterhead(...co)}
  <div class="bi"><div><h1>${kind[0]}</h1><p class="muted">No. ${no} · ${date} · ORIGINAL</p></div><div class="he"><h1>${kind[1]}</h1><p class="muted">מס׳ ${no} · מקור</p></div></div>
  <div class="box" style="margin:5mm 0"><dl class="kv"><dt>Customer · לקוח</dt><dd>Sample Owner (fictional) c/o Easybayit</dd><dt>Property · נכס</dt><dd>${PROP}</dd></dl></div>
  ${itemsTable(items)}${extra}
  <p class="small muted" style="margin-top:6mm">Issued by the supplier directly to the owner — no intermediary mark-up. · הונפק ישירות על ידי הספק לבעלים.</p>`)]);

const third = {
  'quote-heater-a': () => quote(C.hA, 'Q-2026-0806-A', '06/08/2026', 'Water heater replacement · החלפת דוד מים', [['150 L water heater, solar-ready, incl. delivery · דוד 150 ליטר', 2750], ['Removal of old tank and disposal · פירוק ופינוי', 350], ['Installation, connections, testing · התקנה וחיבורים', 800]], ['5-year manufacturer warranty on tank, 1 year on labour · אחריות 5 שנים', 'Installation within 48 hours of approval · התקנה תוך 48 שעות', 'Price includes VAT · המחיר כולל מע״מ']),
  'quote-heater-b': () => quote(C.hB, 'SS-1187', '06/08/2026', 'Water heater replacement · החלפת דוד מים', [['150 L water heater with new solar collector connection · דוד 150 ליטר + חיבור קולט', 3400], ['Removal and disposal · פירוק ופינוי', 300], ['Installation and roof work · התקנה ועבודת גג', 650]], ['3-year warranty on tank · אחריות 3 שנים', 'Installation within 5 working days · התקנה תוך 5 ימי עבודה', 'Price includes VAT · המחיר כולל מע״מ']),
  'quote-heater-c': () => quote(C.hC, 'DB/26/442', '06/08/2026', 'Water heater replacement · החלפת דוד מים', [['120 L water heater · דוד 120 ליטר', 2450], ['Removal · פירוק', 300], ['Installation · התקנה', 900]], ['1-year warranty · אחריות שנה', 'Earliest installation date: in 7 days · התקנה בעוד 7 ימים', 'Price includes VAT · המחיר כולל מע״מ']),
  'quote-leak-a': () => quote(C.lA, 'EP-2026-311', '08/07/2026', 'Kitchen sink leak · נזילה בכיור המטבח', [['New siphon and drain pipe · סיפון וצינור ניקוז חדשים', 380], ['New kitchen tap · ברז מטבח חדש', 620], ['Labour, 2 hours · עבודה, שעתיים', 450]], ['Available in 3 days · זמינות בעוד 3 ימים', '6-month warranty on labour · אחריות 6 חודשים', 'Price includes VAT · המחיר כולל מע״מ']),
  'quote-leak-b': () => quote(C.lB, 'SP-0708-02', '08/07/2026', 'Kitchen sink leak · נזילה בכיור המטבח', [['Replace siphon and seals · החלפת סיפון ואטמים', 330], ['Labour and call-out · עבודה והגעה', 650]], ['Available tomorrow morning · זמינות מחר בבוקר', '12-month warranty on labour · אחריות 12 חודשים', 'Price includes VAT · המחיר כולל מע״מ']),
  'quote-leak-c': () => quote(C.lC, 'DF-5521', '08/07/2026', 'Kitchen sink leak · נזילה בכיור המטבח', [['Siphon, seals, drain cleaning · סיפון, אטמים, פתיחת סתימה', 500], ['Labour · עבודה', 700]], ['Available in 2 days · זמינות בעוד יומיים', '6-month warranty · אחריות 6 חודשים', 'Price includes VAT · המחיר כולל מע״מ']),
  'invoice-heater': () => invoice(C.hA, ['Tax invoice', 'חשבונית מס'], '2026-0814', '14/08/2026', [['150 L water heater, solar-ready · דוד 150 ליטר', 2750], ['Removal and disposal · פירוק ופינוי', 350], ['Installation, connections, testing · התקנה', 800]], '<p class="small" style="margin-top:4mm">Ref. quote Q-2026-0806-A, approved by the owner on 06/08/2026 · בהתאם להצעה שאושרה</p>'),
  'invoice-leak': () => invoice(C.lB, ['Tax invoice', 'חשבונית מס'], '1043', '09/07/2026', [['Replace siphon and seals · החלפת סיפון ואטמים', 330], ['Labour and call-out · עבודה והגעה', 650]], '<p class="small" style="margin-top:4mm">Ref. quote SP-0708-02 · בהתאם להצעה</p>'),
  'receipt-leak': () => invoice(C.lB, ['Receipt', 'קבלה'], 'R-1043', '10/07/2026', [['Payment for tax invoice 1043 · תשלום עבור חשבונית 1043', 980]], '<div class="box" style="margin-top:4mm"><dl class="kv"><dt>Payment method · אמצעי תשלום</dt><dd>Bank transfer · העברה בנקאית (ref. EX-000980)</dd><dt>Received · התקבל</dt><dd>10/07/2026</dd></dl></div>'),
  'receipt-vaad': () => invoice(['Building Committee, Rehov HaDugma 12 (fictional)', 'ועד הבית, רחוב הדוגמה 12 (בדיוני)', 'Treasurer: building committee<br>Example address', '#475569', 'VB'], ['Receipt', 'קבלה'], 'VB-2026-Q3-04', '07/09/2026', [['Special levy Q3 2026 — elevator maintenance, Apt. 4 · היטל מיוחד רבעון 3 — מעלית', 450]], '<p class="small muted" style="margin-top:4mm">Building committees are not VAT-registered; amounts shown for layout only (example). · דוגמה בלבד</p>'),
  'insurance-building': () => doc([page(`${letterhead('Example Insurance Co. Ltd (fictional)', 'אקזמפל חברה לביטוח בע״מ (בדיוני)', 'Policy service: 000-000-0100<br>Example City', '#15803d', 'EI')}
    <div class="bi"><div><h1>Building insurance — policy schedule</h1><p class="muted">Policy no. EX-BLD-2026-0001</p></div><div class="he"><h1>ביטוח מבנה — דף רשימה</h1></div></div>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>Insured · המבוטח</dt><dd>Sample Owner (fictional)</dd><dt>Property · נכס</dt><dd>${PROP}</dd><dt>Period · תקופה</dt><dd>01/01/2026 – 31/12/2026</dd><dt>Mortgagee · משועבד</dt><dd>— none · אין</dd></dl></div>
    <table><thead><tr><th>Cover · כיסוי</th><th class="num">Sum insured (example) ₪</th></tr></thead><tbody><tr><td>Structure · מבנה</td><td class="num">1,350,000</td></tr><tr><td>Water damage · נזקי מים</td><td class="num">included · כלול</td></tr><tr><td>Earthquake · רעידת אדמה</td><td class="num">included · כלול</td></tr><tr><td>Third-party liability (building) · צד ג׳</td><td class="num">1,000,000</td></tr><tr class="tot"><td>Annual premium · פרמיה שנתית</td><td class="num">1,140.00</td></tr></tbody></table>
    <p class="small muted" style="margin-top:6mm">Illustrative schedule only. Real cover, exclusions and deductibles are defined by the insurer’s policy wording. · להמחשה בלבד</p>`)]),
  'insurance-liability': () => doc([page(`${letterhead('Example Insurance Co. Ltd (fictional)', 'אקזמפל חברה לביטוח בע״מ (בדיוני)', 'Policy service: 000-000-0100<br>Example City', '#15803d', 'EI')}
    <div class="bi"><div><h1>Landlord liability — certificate of insurance</h1><p class="muted">Policy no. EX-LIA-2026-0002</p></div><div class="he"><h1>אישור ביטוח — אחריות משכיר</h1></div></div>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>Insured · המבוטח</dt><dd>Sample Owner (fictional)</dd><dt>Property · נכס</dt><dd>${PROP}</dd><dt>Period · תקופה</dt><dd>01/04/2026 – 31/03/2027</dd></dl></div>
    <table><thead><tr><th>Cover · כיסוי</th><th class="num">Limit (example) ₪</th></tr></thead><tbody><tr><td>Third-party liability · אחריות כלפי צד ג׳</td><td class="num">2,000,000</td></tr><tr><td>Deductible · השתתפות עצמית</td><td class="num">1,500</td></tr></tbody></table>
    <p class="small muted" style="margin-top:6mm">Illustrative certificate only. · להמחשה בלבד</p>`)]),
  'gas-certificate': () => doc([page(`${letterhead('Example Gas Technician (fictional)', 'טכנאי גז לדוגמה (בדיוני)', 'Licence no. EX-000 (example)<br>Tel. 000-000-0200', '#b45309', 'GT')}
    <div class="bi"><div><h1>Gas installation inspection certificate</h1><p class="muted">No. G-2026-0329</p></div><div class="he"><h1>אישור בדיקת מתקן גז</h1></div></div>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>Property · נכס</dt><dd>${PROP}</dd><dt>Inspection date · תאריך בדיקה</dt><dd>29/03/2026</dd><dt>Appliances · מכשירים</dt><dd>Hob (4 burners), piping, regulator · כיריים, צנרת, וסת</dd></dl></div>
    <table><thead><tr><th>Check · בדיקה</th><th>Result · תוצאה</th></tr></thead><tbody><tr><td>Leak test · בדיקת דליפה</td><td><span class="chip">Passed · תקין</span></td></tr><tr><td>Ventilation · אוורור</td><td><span class="chip">Passed · תקין</span></td></tr><tr><td>Hoses and connections · צינורות וחיבורים</td><td><span class="chip">Passed · תקין</span></td></tr><tr><td>Regulator · וסת</td><td><span class="chip">Passed · תקין</span></td></tr></tbody></table>
    <div class="sig"><div><div class="sigline">G. Technician</div>Technician signature · חתימת הטכנאי</div><div><div class="sigline"></div>Next check per regulations · הבדיקה הבאה</div></div>`)]),
  'heater-warranty': () => doc([page(`${letterhead(...C.hA)}
    <div class="bi"><div><h1>Warranty certificate</h1><p class="muted">Serial no. EX-HT-150-0001</p></div><div class="he"><h1>תעודת אחריות</h1></div></div>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>Product · מוצר</dt><dd>150 L water heater, solar-ready · דוד 150 ליטר</dd><dt>Installed · הותקן</dt><dd>14/08/2026 at ${PROP}</dd><dt>Tank warranty · אחריות למיכל</dt><dd>5 years — until 14/08/2031 · 5 שנים</dd><dt>Labour warranty · אחריות לעבודה</dt><dd>1 year — until 14/08/2027 · שנה</dd></dl></div>
    <p class="small">Keep this certificate. Service calls: 000-000-0001 (fictional). · יש לשמור תעודה זו.</p>`)]),
  'tenant-guarantee': () => doc([page(`${letterhead('Example Bank Ltd (fictional)', 'בנק לדוגמה בע״מ (בדיוני)', 'Branch 000 · Example City', '#1e3a8a', 'EB')}
    <div class="bi"><div><h1>Autonomous bank guarantee — copy</h1><p class="muted">Guarantee no. EX-GUA-0001</p></div><div class="he"><h1>ערבות בנקאית אוטונומית — העתק</h1></div></div>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>Beneficiary · המוטב</dt><dd>Sample Owner (fictional)</dd><dt>Applicant · המבקש</dt><dd>Sample Tenant (fictional)</dd><dt>Amount · סכום</dt><dd>₪21,600 (3 months’ rent · 3 חודשי שכירות)</dd><dt>Valid until · בתוקף עד</dt><dd>30/06/2027</dd><dt>Linked to · הצמדה</dt><dd>Consumer price index · מדד המחירים לצרכן</dd></dl></div>
    <p class="small muted">Copy for the owner’s file. The original is held as agreed in the lease. · העתק לתיק הבעלים.</p>`)]),
  'lease-agreement': () => doc([
    page(`<div class="bi"><div><h1>Unprotected tenancy agreement</h1><p class="muted">Signed on 18/03/2026</p></div><div class="he"><h1>הסכם שכירות בלתי מוגנת</h1><p class="muted">נחתם ביום 18.3.2026</p></div></div>
    <p class="note" style="margin:4mm 0">Layout example only — not a legal template. Your lease should be drafted or reviewed by a lawyer. · דוגמה לעימוד בלבד</p>
    <table><tbody>
      <tr><td><b>Landlord · המשכיר</b></td><td>Sample Owner (fictional), represented by Easybayit</td></tr>
      <tr><td><b>Tenant · השוכר</b></td><td>Sample Tenant (fictional)</td></tr>
      <tr><td><b>Property · המושכר</b></td><td>${PROP} — 3 rooms, 78 m², storage room</td></tr>
      <tr><td><b>Period · תקופה</b></td><td>01/04/2026 – 31/03/2027, option for 12 more months · אופציה ל-12 חודשים</td></tr>
      <tr><td><b>Rent · דמי שכירות</b></td><td>₪7,200 per month, by the 1st of each month · עד ה-1 בכל חודש</td></tr>
      <tr><td><b>Guarantees · בטחונות</b></td><td>Bank guarantee ₪21,600 + promissory note · ערבות בנקאית + שטר חוב</td></tr>
      <tr><td><b>Paid by tenant · על השוכר</b></td><td>Arnona, water, electricity, gas, regular building committee fees · ארנונה, מים, חשמל, גז, ועד בית</td></tr>
      <tr><td><b>Paid by landlord · על המשכיר</b></td><td>Building insurance, special building levies, structural repairs · ביטוח מבנה, היטלים מיוחדים</td></tr>
    </tbody></table>
    <h3>1. Condition of the property · מצב המושכר</h3><p class="small">The property is delivered as described in the move-in inspection report of 31/03/2026, with photos, acknowledged by both parties. · כמפורט בדוח ביקורת הכניסה.</p>
    <h3>2. Repairs · תיקונים</h3><p class="small">The tenant reports defects through the Easybayit portal or WhatsApp. Repairs are handled according to the management agreement and the owner’s approval threshold.</p>`, { foot: '<span>Page 1 of 2</span><span>EX-LEASE-0001</span>' }),
    page(`<h3>3. Entry · כניסה למושכר</h3><p class="small">Visits are arranged in advance with the tenant, except emergencies.</p>
    <h3>4. End of tenancy · סיום</h3><p class="small">At the end of the tenancy a move-out inspection is performed with the same checklist as at move-in. Guarantees are returned as agreed.</p>
    <h3>5. Annexes · נספחים</h3><ul class="small" style="padding-inline-start:5mm"><li>Move-in inspection report with photos</li><li>Copy of bank guarantee</li><li>Inventory of furniture and appliances</li></ul>
    <div class="sig"><div><div class="sigline">S. Owner</div>Landlord · המשכיר<br>e-signed 18/03/2026 21:10</div><div><div class="sigline">S. Tenant</div>Tenant · השוכר<br>e-signed 18/03/2026 16:05</div></div>`, { foot: '<span>Page 2 of 2</span><span>EX-LEASE-0001</span>' }),
  ]),
  'management-agreement': () => doc([page(`<div class="ebhead"><div class="eblogo">${ebLogo}<div><b>Easybayit</b><small>Easy Bayit Property Management Ltd · Company no. 515863884</small></div></div><span class="muted small">Agreement EX-MA-0001</span></div>
    <h1>Property management agreement — key terms</h1><p class="muted">Signed 21/02/2026 · Draft structure: final text to be reviewed by our lawyer [TO CONFIRM]</p>
    <table style="margin-top:5mm"><tbody>
      <tr><td><b>Owner</b></td><td>Sample Owner (fictional)</td></tr><tr><td><b>Property</b></td><td>${PROP}</td></tr>
      <tr><td><b>Plan</b></td><td>Full — 10% of rent + VAT, min. ₪500 (example pricing [TO CONFIRM])</td></tr>
      <tr><td><b>Approval threshold</b></td><td>₪1,000 per job — above it, written approval in the portal (except defined emergencies)</td></tr>
      <tr><td><b>Quotes</b></td><td>Several quotes (usually three) for jobs above the threshold; all uploaded to the owner’s drive</td></tr>
      <tr><td><b>Works</b></td><td>Supplier invoices passed on at cost, no mark-up [TO CONFIRM]</td></tr>
      <tr><td><b>Rent</b></td><td>Held in a segregated account and paid out monthly with a statement [TO CONFIRM]</td></tr>
      <tr><td><b>Reporting</b></td><td>Monthly statement and health report; annual summary for the owner’s accountant</td></tr>
      <tr><td><b>Termination</b></td><td>30 days’ written notice, no exit fee; full handover of documents and keys [TO CONFIRM]</td></tr>
    </tbody></table>
    <div class="sig"><div><div class="sigline">Easybayit</div>For Easy Bayit Property Management Ltd</div><div><div class="sigline">S. Owner</div>Owner · e-signed 21/02/2026 19:02</div></div>`)]),
  'arnona-transfer': () => doc([page(`${letterhead('Local authority (example)', 'רשות מקומית לדוגמה — אגף הארנונה', 'מוקד 000 (לדוגמה)', '#be123c', 'RA')}
    <div class="he"><h1>אישור חילופי מחזיקים</h1><p class="muted">מס׳ פנייה EX-ARN-0403</p>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>נכס</dt><dd>רחוב הדוגמה 12, דירה 4 (בדיוני)</dd><dt>מחזיק יוצא</dt><dd>בעלים לדוגמה (בדיוני)</dd><dt>מחזיק נכנס</dt><dd>שוכר לדוגמה (בדיוני)</dd><dt>תאריך תחילה</dt><dd>01.04.2026</dd><dt>מס׳ חשבון ארנונה</dt><dd>000000000 (לדוגמה)</dd></dl></div>
    <p>הרינו לאשר כי עודכן שם המחזיק בנכס הנ״ל החל מהתאריך המצוין. החיובים מתאריך זה יחולו על המחזיק הנכנס.</p></div>
    <p class="small muted" style="margin-top:6mm">Original in Hebrew. Confirms the change of arnona payer to the tenant from 01/04/2026.</p>`)]),
  'water-transfer': () => doc([page(`${letterhead('Water corporation (example)', 'תאגיד מים לדוגמה', 'מוקד 000 (לדוגמה)', '#0369a1', 'MW')}
    <div class="he"><h1>אישור העברת חשבון מים וקריאת מונה</h1>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>נכס</dt><dd>רחוב הדוגמה 12, דירה 4 (בדיוני)</dd><dt>צרכן חדש</dt><dd>שוכר לדוגמה (בדיוני)</dd><dt>תאריך</dt><dd>01.04.2026</dd><dt>קריאת מונה</dt><dd>01234 מ״ק</dd><dt>מס׳ מונה</dt><dd>EX-WM-0001</dd></dl></div></div>
    <p class="small muted" style="margin-top:6mm">Original in Hebrew. Water account transferred to the tenant; meter reading 01234 m³ on 01/04/2026.</p>`)]),
  'electricity-transfer': () => doc([page(`${letterhead('Electricity supplier (example)', 'ספק חשמל לדוגמה', 'מוקד 000 (לדוגמה)', '#ca8a04', 'EL')}
    <div class="he"><h1>אישור החלפת שם משלם</h1>
    <div class="box" style="margin:5mm 0"><dl class="kv"><dt>נכס</dt><dd>רחוב הדוגמה 12, דירה 4 (בדיוני)</dd><dt>משלם חדש</dt><dd>שוכר לדוגמה (בדיוני)</dd><dt>תאריך</dt><dd>01.04.2026</dd><dt>קריאת מונה</dt><dd>045678 קוט״ש</dd></dl></div></div>
    <p class="small muted" style="margin-top:6mm">Original in Hebrew. Electricity payer changed to the tenant; meter reading 045678 kWh on 01/04/2026.</p>`)]),
};

// ---------- Documenti Easybayit (4 lingue) ----------
const ebHeader = (t, title, sub) => `<div class="ebhead"><div class="eblogo">${ebLogo}<div><b>Easybayit</b><small>${esc(t.company)}</small></div></div></div><h1>${esc(title)}</h1><p class="muted">${esc(sub)}</p>`;
const ebFoot = (t, n, tot, code) => `<span>${esc(t.integrity)}: ${code}</span><span>${esc(t.page.replace('{n}', n).replace('{t}', tot))}</span>`;
const ownerBox = (t, extra = '') => `<div class="box" style="margin:4mm 0"><dl class="kv"><dt>${esc(t.owner)}</dt><dd>${esc(t.ownerName)}</dd><dt>${esc(t.property)}</dt><dd>${esc(t.propertyVal)}</dd>${extra}</dl></div>`;
const fmtD = (iso, intl) => new Intl.DateTimeFormat(intl, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso + 'T12:00:00Z'));
const STMTS = {
  '2026-07': { lines: [['2026-07-01', 'rent', 7200], ['2026-07-09', 'leak', -980], ['2026-07-31', 'fee', -849.6]], payout: '2026-08-05' },
  '2026-08': { lines: [['2026-08-01', 'rent', 7200], ['2026-08-14', 'heater', -3900], ['2026-08-31', 'fee', -849.6]], payout: '2026-09-05' },
  '2026-09': { lines: [['2026-09-01', 'rent', 7200], ['2026-09-07', 'vaad', -450], ['2026-09-30', 'fee', -849.6]], payout: '2026-10-05' },
};
const statement = (lang, m) => {
  const t = L[lang]; const s = STMTS[m];
  const inc = s.lines.filter((l) => l[2] > 0).reduce((a, l) => a + l[2], 0), exp = s.lines.filter((l) => l[2] < 0).reduce((a, l) => a + l[2], 0);
  const label = (k) => t.lines[k].replace('{m}', t.months[m]);
  return doc([page(`${ebHeader(t, t.stTitle, t.months[m])}${ownerBox(t, `<dt>${esc(t.period)}</dt><dd>${esc(t.months[m])}</dd>`)}
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><span class="small muted">${esc(t.income)}</span><b>₪${money(inc, t.intl)}</b></div><div class="kpi"><span class="small muted">${esc(t.expenses)}</span><b>₪${money(exp, t.intl)}</b></div><div class="kpi hl"><span class="small muted">${esc(t.net)}</span><b>₪${money(inc + exp, t.intl)}</b></div></div>
    <table><thead><tr><th>${esc(t.date)}</th><th>${esc(t.item)}</th><th>${esc(t.doc)}</th><th class="num">${esc(t.amount)}</th></tr></thead><tbody>
    ${s.lines.map(([d, k, v]) => `<tr><td class="num" style="text-align:start">${fmtD(d, t.intl)}</td><td>${esc(label(k))}</td><td class="small muted">${k === 'rent' ? '—' : k === 'fee' ? 'Easybayit' : '📎 PDF'}</td><td class="num ${v > 0 ? 'pos' : 'neg'}">${money(v, t.intl)}</td></tr>`).join('')}
    <tr class="tot"><td colspan="3">${esc(t.net)}</td><td class="num">${money(inc + exp, t.intl)}</td></tr></tbody></table>
    <p class="small" style="margin-top:4mm">${esc(t.payout.replace('{d}', fmtD(s.payout, t.intl)))}</p>`, { banner: t.banner, foot: ebFoot(t, 1, 1, `EXMP-${m.replace('-', '')}-0000-0000`) })], { lang, dir: t.dir });
};
const img = (id) => `../../${OUT}/${id}-thumb.jpg`;
const healthReport = (lang) => {
  const t = L[lang]; const pn = t.photoNames;
  const s = STMTS['2026-09'];
  const label = (k) => t.lines[k].replace('{m}', t.months['2026-09']);
  return doc([
    page(`${ebHeader(t, t.hrTitle, t.hrSub)}${ownerBox(t)}
      <div class="kpis"><div class="kpi"><span class="small muted">${esc(t.kpi.rent)}</span><b>₪${money(7200, t.intl)}</b></div><div class="kpi"><span class="small muted">${esc(t.kpi.exp)}</span><b>₪${money(-1299.6, t.intl)}</b></div><div class="kpi hl"><span class="small muted">${esc(t.kpi.net)}</span><b>₪${money(5900.4, t.intl)}</b></div><div class="kpi"><span class="small muted">${esc(t.kpi.ytd)}</span><b>₪${money(32772.4, t.intl)}</b></div></div>
      <p class="small"><span class="chip">✓</span> ${esc(t.onTime)}</p>
      <div class="row" style="margin-top:3mm"><div class="col"><h2>${esc(t.status)}</h2><ul class="checks">${t.checks.map(([k, v]) => `<li><span class="dot ${k === 'warn' ? 'warn' : ''}">${k === 'warn' ? '!' : '✓'}</span>${esc(v)}</li>`).join('')}</ul></div>
      <div class="col"><h2>${esc(t.deadlines)}</h2><table><tbody>${t.dl.map(([d, v]) => `<tr><td class="num" style="text-align:start;font-weight:600">${esc(d)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div></div>
      <h2>${esc(t.maint)}</h2><p class="small">${esc(t.maintText)}</p>
      <h2>${esc(t.photos)}</h2><div class="photos">${[['living', '31/03/2026 10:04'], ['kitchen', '31/03/2026 10:11'], ['heater', '14/08/2026 15:52'], ['balcony', '31/03/2026 10:31']].map(([p, d]) => `<figure><img src="${img('photo-' + p)}"><figcaption>${esc(pn[p])} · <span dir="ltr">${d}</span></figcaption></figure>`).join('')}</div>`,
      { banner: t.banner, foot: ebFoot(t, 1, 2, 'EXMP-HR09-0000-0000') }),
    page(`<h2 style="margin-top:0">${esc(t.note)}</h2><p class="note">${esc(t.noteText)}</p>
      <h2>${esc(t.expDetail)}</h2><table><thead><tr><th>${esc(t.date)}</th><th>${esc(t.item)}</th><th class="num">${esc(t.amount)}</th></tr></thead><tbody>
      ${s.lines.map(([d, k, v]) => `<tr><td class="num" style="text-align:start">${fmtD(d, t.intl)}</td><td>${esc(label(k))}</td><td class="num ${v > 0 ? 'pos' : ''}">${money(v, t.intl)}</td></tr>`).join('')}
      <tr class="tot"><td colspan="2">${esc(t.net)}</td><td class="num">${money(5900.4, t.intl)}</td></tr></tbody></table>
      <div class="row" style="margin-top:2mm"><div class="col"><h2>${esc(t.docsAdded)}</h2><ul class="checks">${t.docsList.map((v) => `<li><span class="dot" style="background:#1a4fd6">+</span>${esc(v)}</li>`).join('')}</ul></div>
      <div class="col"><h2>${esc(t.approvals)}</h2><p class="small">${esc(t.approvalsText)}</p></div></div>`,
      { banner: t.banner, foot: ebFoot(t, 2, 2, 'EXMP-HR09-0000-0000') }),
  ], { lang, dir: t.dir });
};
const inspection = (lang) => {
  const t = L[lang]; const pn = t.photoNames;
  const times = { living: '10:04', kitchen: '10:11', bathroom: '10:18', bedroom: '10:25', balcony: '10:31', meters: '10:36' };
  return doc([
    page(`${ebHeader(t, t.inspTitle, t.inspDateVal)}${ownerBox(t, `<dt>${esc(t.inspDate)}</dt><dd>${esc(t.inspDateVal)}</dd><dt>${esc(t.inspector)}</dt><dd>${esc(t.inspectorVal)}</dd><dt>${esc(t.present)}</dt><dd>${esc(t.presentVal)}</dd>`)}
      <div class="row"><div class="col box"><b class="small">${esc(t.meters)}</b><p class="small">${esc(t.water)}: <span dir="ltr">01234 m³</span> · ${esc(t.elec)}: <span dir="ltr">045678 kWh</span></p></div><div class="col box"><b class="small">${esc(t.keys)}</b><p class="small">${esc(t.keysVal)}</p></div></div>
      <table style="margin-top:4mm"><thead><tr><th>${esc(t.room)}</th><th>${esc(t.element)}</th><th>${esc(t.condition)}</th><th>${esc(t.notes)}</th></tr></thead><tbody>
      ${t.rooms.map(([r, e, c, n]) => `<tr><td><b>${esc(r)}</b></td><td>${esc(e)}</td><td class="cond-${c}">${esc(t.cond[c])}</td><td class="small muted">${esc(n)}</td></tr>`).join('')}</tbody></table>`,
      { banner: t.banner, foot: ebFoot(t, 1, 2, 'EXMP-IN31-0000-0000') }),
    page(`<h2 style="margin-top:0">${esc(t.photosTitle)}</h2><div class="photos photos3">${Object.entries(times).map(([p, h]) => `<figure><img src="${img('photo-' + p)}"><figcaption>${esc(pn[p])} · <span dir="ltr">31/03/2026 ${h}</span></figcaption></figure>`).join('')}</div>
      <h2>${esc(t.acks)}</h2><table><tbody><tr><td><span class="dot" style="display:inline-grid">✓</span> ${esc(t.ackTenant)}</td><td class="num">31/03/2026 11:20</td></tr><tr><td><span class="dot" style="display:inline-grid">✓</span> ${esc(t.ackOwner)}</td><td class="num">31/03/2026 20:47</td></tr></tbody></table>
      <p class="small muted" style="margin-top:3mm">${esc(t.ackNote)}</p>`,
      { banner: t.banner, foot: ebFoot(t, 2, 2, 'EXMP-IN31-0000-0000') }),
  ], { lang, dir: t.dir });
};
const taxSummary = (lang) => {
  const t = L[lang];
  const net = t.taxRows.reduce((a, r) => a + r[1], 0);
  return doc([page(`${ebHeader(t, t.taxTitle, t.taxSub)}${ownerBox(t)}
    <table style="margin-top:4mm"><thead><tr><th>${esc(t.cat)}</th><th class="num">${esc(t.amount)}</th></tr></thead><tbody>
    ${t.taxRows.map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num ${v > 0 ? 'pos' : ''}">${money(v, t.intl)}</td></tr>`).join('')}
    <tr class="tot"><td>${esc(t.net)}</td><td class="num">${money(net, t.intl)}</td></tr></tbody></table>
    <p class="note" style="margin-top:5mm">${esc(t.taxNote)}</p><p class="small" style="margin-top:3mm">${esc(t.taxDocs)}</p>`, { banner: t.banner, foot: ebFoot(t, 1, 1, 'EXMP-TX26-0000-0000') })], { lang, dir: t.dir });
};

// ---------- "Foto" illustrate (al posto di foto reali) ----------
const scenes = {
  living: `<rect width="1600" height="1200" fill="#efe6da"/><rect y="860" width="1600" height="340" fill="#c9a77c"/><path d="M0 860h1600" stroke="#a8865c" stroke-width="6"/>
    <rect x="980" y="180" width="460" height="520" rx="8" fill="#bfe3f5" stroke="#fff" stroke-width="22"/><path d="M1210 180v520M980 440h460" stroke="#fff" stroke-width="14"/><rect x="960" y="700" width="500" height="26" fill="#e7dccd"/>
    <rect x="160" y="560" width="660" height="260" rx="40" fill="#4f6d8f"/><rect x="200" y="470" width="580" height="170" rx="36" fill="#5b7ba0"/><rect x="130" y="560" width="90" height="250" rx="30" fill="#46617f"/><rect x="760" y="560" width="90" height="250" rx="30" fill="#46617f"/>
    <rect x="240" y="500" width="150" height="110" rx="22" fill="#e9c46a"/><rect x="560" y="500" width="150" height="110" rx="22" fill="#f4a261"/><ellipse cx="520" cy="980" rx="460" ry="70" fill="#9c6b3e" opacity=".35"/>
    <rect x="1320" y="760" width="90" height="130" rx="12" fill="#b5651d"/><circle cx="1365" cy="690" r="90" fill="#3f7d4e"/><circle cx="1310" cy="640" r="60" fill="#4c9a5f"/><circle cx="1420" cy="630" r="55" fill="#4c9a5f"/>
    <rect x="300" y="190" width="380" height="230" rx="6" fill="#fff" stroke="#c8b9a5" stroke-width="12"/><path d="M330 380l90-90 70 70 60-50 100 70" fill="none" stroke="#7aa7c7" stroke-width="12"/>
    <rect x="1080" y="90" width="300" height="70" rx="14" fill="#fff"/><rect x="1100" y="110" width="200" height="12" rx="6" fill="#cbd5e1"/>`,
  kitchen: `<rect width="1600" height="1200" fill="#f3efe7"/><rect y="1000" width="1600" height="200" fill="#d8d2c7"/>
    <rect x="120" y="140" width="1360" height="300" rx="10" fill="#fff" stroke="#d6cfc3" stroke-width="6"/><path d="M460 140v300M800 140v300M1140 140v300" stroke="#d6cfc3" stroke-width="6"/>
    <rect x="120" y="440" width="1360" height="200" fill="#e9e3d8"/><path d="M120 440h1360" stroke="#cfc6b6" stroke-width="4"/><g fill="#d9d2c4">${Array.from({ length: 34 }, (_, i) => `<rect x="${120 + (i % 17) * 80}" y="${450 + Math.floor(i / 17) * 95}" width="74" height="88" rx="4"/>`).join('')}</g>
    <rect x="100" y="640" width="1400" height="40" rx="8" fill="#6b7280"/><rect x="120" y="680" width="1360" height="320" fill="#fff" stroke="#d6cfc3" stroke-width="6"/><path d="M460 680v320M800 680v320M1140 680v320" stroke="#d6cfc3" stroke-width="6"/>
    <g fill="#9ca3af">${[290, 630, 970, 1310].map((x) => `<rect x="${x - 40}" y="720" width="80" height="10" rx="5"/>`).join('')}</g>
    <rect x="520" y="600" width="230" height="50" rx="10" fill="#cbd5e1"/><path d="M640 600v-90a40 40 0 0 1 80 0" fill="none" stroke="#94a3b8" stroke-width="16"/>
    <rect x="900" y="590" width="200" height="60" rx="6" fill="#1f2937"/><circle cx="950" cy="620" r="14" fill="#374151"/><circle cx="1050" cy="620" r="14" fill="#374151"/>`,
  bathroom: `<rect width="1600" height="1200" fill="#e7eef2"/><g fill="#d4e0e7">${Array.from({ length: 96 }, (_, i) => `<rect x="${(i % 16) * 100 + 4}" y="${Math.floor(i / 16) * 100 + 404}" width="92" height="92" rx="4"/>`).join('')}</g>
    <rect x="1000" y="120" width="460" height="920" rx="10" fill="#cfe3ee" opacity=".6" stroke="#9fb7c5" stroke-width="10"/><circle cx="1230" cy="230" r="60" fill="#94a3b8"/><path d="M1230 290v120" stroke="#94a3b8" stroke-width="14"/>
    <rect x="260" y="160" width="380" height="300" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="10"/><rect x="220" y="560" width="460" height="90" rx="30" fill="#fff" stroke="#cbd5e1" stroke-width="8"/>
    <rect x="300" y="650" width="300" height="300" rx="20" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="8"/><path d="M450 560v-60h40" fill="none" stroke="#94a3b8" stroke-width="14"/>
    <rect x="740" y="120" width="180" height="300" rx="70" fill="#f8fafc" stroke="#cbd5e1" stroke-width="10"/><text x="830" y="290" text-anchor="middle" font-size="40" fill="#64748b" font-family="Heebo">150L</text>`,
  bedroom: `<rect width="1600" height="1200" fill="#e9e4f0"/><rect y="900" width="1600" height="300" fill="#b9a58a"/>
    <rect x="80" y="160" width="360" height="600" rx="8" fill="#bfe3f5" stroke="#fff" stroke-width="20"/><path d="M260 160v600" stroke="#fff" stroke-width="12"/>
    <rect x="560" y="420" width="760" height="140" rx="20" fill="#6d5a8a"/><rect x="520" y="560" width="840" height="300" rx="24" fill="#f8fafc"/><rect x="520" y="660" width="840" height="200" rx="24" fill="#a5b4fc"/>
    <rect x="600" y="500" width="220" height="110" rx="30" fill="#fff"/><rect x="1060" y="500" width="220" height="110" rx="30" fill="#fff"/>
    <rect x="1400" y="200" width="200" height="700" fill="#d6c3a5" stroke="#bfa98a" stroke-width="8"/><circle cx="1430" cy="560" r="10" fill="#8b7355"/>`,
  balcony: `<rect width="1600" height="1200" fill="#9fd3f0"/><circle cx="1320" cy="220" r="90" fill="#fde68a"/>
    <path d="M0 640l120-60h160l60-90h200l80 70h160l90-120h180l70 80h200l120-50h160v370H0z" fill="#e7d8b8"/><g fill="#d4c29d">${Array.from({ length: 14 }, (_, i) => `<rect x="${40 + i * 110}" y="${640 + (i % 3) * 30}" width="60" height="70" rx="4"/>`).join('')}</g>
    <rect y="900" width="1600" height="300" fill="#cbbfa8"/><g stroke="#475569" stroke-width="16">${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 100} 700v220"/>`).join('')}</g><rect y="680" width="1600" height="30" fill="#334155"/>
    <rect x="1180" y="780" width="160" height="150" rx="14" fill="#b45309"/><circle cx="1260" cy="730" r="80" fill="#3f7d4e"/>`,
  meters: `<rect width="1600" height="1200" fill="#d6d3cd"/><rect x="200" y="200" width="1200" height="800" rx="16" fill="#e7e5e0" stroke="#a8a29e" stroke-width="10"/>
    <circle cx="520" cy="560" r="200" fill="#f8fafc" stroke="#334155" stroke-width="20"/><rect x="390" y="510" width="260" height="80" rx="8" fill="#0f172a"/><text x="520" y="568" text-anchor="middle" font-size="56" fill="#f8fafc" font-family="monospace">01234</text><text x="520" y="680" text-anchor="middle" font-size="36" fill="#334155" font-family="Heebo">m³</text>
    <rect x="900" y="330" width="380" height="460" rx="20" fill="#f1f5f9" stroke="#334155" stroke-width="14"/><rect x="950" y="420" width="280" height="90" rx="8" fill="#0f172a"/><text x="1090" y="482" text-anchor="middle" font-size="54" fill="#86efac" font-family="monospace">045678</text><text x="1090" y="580" text-anchor="middle" font-size="36" fill="#334155" font-family="Heebo">kWh</text><circle cx="1090" cy="690" r="34" fill="#94a3b8"/>`,
  heater: `<rect width="1600" height="1200" fill="#cfd8dc"/><rect y="980" width="1600" height="220" fill="#a3a3a3"/>
    <rect x="560" y="140" width="480" height="860" rx="200" fill="#f8fafc" stroke="#94a3b8" stroke-width="14"/><rect x="620" y="420" width="360" height="160" rx="16" fill="#e2e8f0"/><text x="800" y="520" text-anchor="middle" font-size="64" font-weight="700" fill="#475569" font-family="Heebo">150 L</text>
    <path d="M700 1000v120M900 1000v120" stroke="#64748b" stroke-width="22"/><path d="M700 140V60h-300M900 140V40h400" fill="none" stroke="#b45309" stroke-width="22"/><circle cx="800" cy="700" r="40" fill="#22c55e"/><rect x="1180" y="300" width="260" height="70" rx="10" fill="#fff"/><text x="1310" y="348" text-anchor="middle" font-size="34" fill="#15803d" font-family="Heebo">✓ OK</text>`,
};
const photoHtml = (key, stamp) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}*{margin:0}body{width:1600px;height:1200px;position:relative;overflow:hidden;font-family:Heebo}
  .ts{position:absolute;right:40px;bottom:36px;font:700 44px monospace;color:#fbbf24;text-shadow:0 2px 6px #000;letter-spacing:2px}
  .wm{position:absolute;inset:0;display:grid;place-items:center}.wm span{font-size:150px;font-weight:700;color:rgba(255,255,255,.55);transform:rotate(-20deg);letter-spacing:.06em;text-shadow:0 4px 20px rgba(0,0,0,.25)}
  .lbl{position:absolute;left:36px;top:32px;background:rgba(11,19,36,.75);color:#fff;font-size:30px;padding:10px 20px;border-radius:12px}
  .tag{position:absolute;left:36px;bottom:36px;background:#d97706;color:#fff;font-size:28px;font-weight:700;padding:8px 18px;border-radius:10px;letter-spacing:.05em}</style></head>
  <body><svg width="1600" height="1200" viewBox="0 0 1600 1200">${scenes[key]}</svg><div class="wm"><span>EXAMPLE · ESEMPIO</span></div>
  <div class="lbl">Illustration — stands in for a real photo · דוגמה</div><div class="tag">EXAMPLE</div><div class="ts">${stamp}</div></body></html>`;
const PHOTOS = { living: '2026-03-31 10:04', kitchen: '2026-03-31 10:11', bathroom: '2026-03-31 10:18', bedroom: '2026-03-31 10:25', balcony: '2026-03-31 10:31', meters: '2026-03-31 10:36', heater: '2026-08-14 15:52' };

// ---------- Rendering ----------
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
for (const [k, stamp] of Object.entries(PHOTOS)) {
  const f = join(TMP, `photo-${k}.html`); writeFileSync(f, photoHtml(k, stamp));
  await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${OUT}/photo-${k}.jpg`, type: 'jpeg', quality: 78 });
  await p.setViewportSize({ width: 1600, height: 1200 });
  const tp = await ctx.newPage(); await tp.setViewportSize({ width: 480, height: 360 });
  await tp.goto('file://' + f); await tp.evaluate(() => { document.body.style.transform = 'scale(.3)'; document.body.style.transformOrigin = '0 0'; return document.fonts.ready; });
  await tp.screenshot({ path: `${OUT}/photo-${k}-thumb.jpg`, type: 'jpeg', quality: 72, clip: { x: 0, y: 0, width: 480, height: 360 } }); await tp.close();
  console.log('✓ photo', k);
}
const pdfPage = await (await browser.newContext({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.25 })).newPage();
async function render(html, outBase, name) {
  const abs = join(TMP, `${name}.html`);
  // le immagini sono referenziate relative a TMP → riscrivo con percorso assoluto
  writeFileSync(abs, html.replaceAll(`../../${OUT}/`, `file://${join(process.cwd(), OUT)}/`));
  await pdfPage.goto('file://' + abs, { waitUntil: 'load' }); await pdfPage.evaluate(() => document.fonts.ready);
  await pdfPage.pdf({ path: `${outBase}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  const pages = await pdfPage.$$('.page');
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `${outBase}-p${i + 1}.jpg`, type: 'jpeg', quality: 80 });
  return pages.length;
}
const counts = {};
for (const [id, fn] of Object.entries(third)) { counts[id] = await render(fn(), `${OUT}/${id}`, id); console.log('✓', id, counts[id]); }
for (const lang of LANGS) {
  for (const m of ['2026-07', '2026-08', '2026-09']) await render(statement(lang, m), `${OUT}/${lang}/statement-${m}`, `st-${lang}-${m}`);
  counts['health-report-2026-09'] = await render(healthReport(lang), `${OUT}/${lang}/health-report-2026-09`, `hr-${lang}`);
  counts['inspection-move-in'] = await render(inspection(lang), `${OUT}/${lang}/inspection-move-in`, `in-${lang}`);
  await render(taxSummary(lang), `${OUT}/${lang}/tax-summary-2026`, `tx-${lang}`);
  copyFileSync(`${OUT}/${lang}/health-report-2026-09.pdf`, `public/downloads/health-report-example-${lang}.pdf`);
  copyFileSync(`${OUT}/${lang}/inspection-move-in.pdf`, `public/downloads/inspection-report-example-${lang}.pdf`);
  console.log('✓ localized', lang);
}
await browser.close();
// Controllo: il numero di pagine deve coincidere con `pages` in src/data/trust/drive-example.ts
console.log('pagine per documento:', JSON.stringify(Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 1))));
