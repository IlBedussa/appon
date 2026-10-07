// Genera i PDF della checklist di conformità (una per lingua) da /legal-tax/?print=checklist.
// Richiede la preview su http://localhost:4321. Uso: node scripts/make-checklists.mjs
// Output: public/downloads/compliance-checklist-{lang}.pdf (rigenerare dopo ogni modifica ai testi e ricostruire).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
mkdirSync('public/downloads', { recursive: true });
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
for (const lang of ['en', 'he', 'fr', 'it']) {
  const p = await (await b.newContext()).newPage();
  await p.goto(`${BASE}${lang === 'en' ? '' : '/' + lang}/legal-tax/?print=checklist`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: `public/downloads/compliance-checklist-${lang}.pdf`, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
  console.log('✓', lang);
}
await b.close();
