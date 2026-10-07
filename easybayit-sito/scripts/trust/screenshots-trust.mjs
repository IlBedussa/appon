// Screenshot del trust batch (sito). Richiede una preview su una porta libera (4321 è della preview condivisa):
//   npx astro build --outDir ./.trust-dist && PORT=4331 node .trust-dist/server/entry.mjs
// poi: node scripts/trust/screenshots-trust.mjs   (ONLY=regex per rifare solo alcune immagini)
// Output: screenshots/trust-batch/*.png
import { chromium } from 'playwright-core';
const B = process.env.BASE ?? 'http://127.0.0.1:4331';
const out = '/workspace/easybayit/screenshots/trust-batch';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pre = (l) => (l === 'en' ? '' : '/' + l);
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
async function shot(name, path, { w = 1280, h = 900, full = true, act, lang } = {}) {
  if (ONLY && !ONLY.test(name)) return;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('eb_lp', JSON.stringify({ done: true })); } catch {} });
  const p = await ctx.newPage();
  await p.goto(B + path, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important} .lead-popup, dialog.lp{display:none!important}' });
  if (act) await act(p);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  await ctx.close();
  console.log('ok', name);
}
const driveEl = async (p, name, w) => { const el = await p.$('.drive'); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await el.screenshot({ path: `${out}/${name}.png` }); };
for (const l of ['en', 'he', 'it']) {
  const P = pre(l) + '/transparency-pledge/';
  await shot(`pledge-${l}-desktop`, P);
  await shot(`pledge-${l}-mobile`, P, { w: 390, h: 844 });
  // drive closeups
  for (const [suffix, hash, w] of [['root', '', 1280], ['quotes', '#drive=quotes-heater', 1280], ['inspections', '#drive=inspections', 1280], ['root-mobile', '', 390]]) {
    await shot(`drive-${suffix}-${l}`, P + hash, { w, h: w < 500 ? 844 : 900, full: false, act: (p) => driveEl(p, `drive-${suffix}-${l}`) });
  }
  await shot(`drive-preview-quote-${l}`, P + '#drive=quotes-heater&file=quote-heater-a', { full: false });
  await shot(`drive-preview-statement-${l}-mobile`, P + '#drive=statements&file=statement-2026-09', { w: 390, h: 844, full: false });
  for (const pg of ['monthly-health-report', 'photo-inspections', 'switching-manager']) {
    await shot(`${pg}-${l}-desktop`, pre(l) + `/${pg}/`);
    if (l !== 'it') await shot(`${pg}-${l}-mobile`, pre(l) + `/${pg}/`, { w: 390, h: 844 });
  }
  const pick = async (p) => { await p.locator('[data-days] button:not([disabled])').first().click().catch(() => {}); await p.waitForTimeout(300); await p.locator('[data-times] button:not([disabled])').nth(2).click().catch(() => {}); };
  await shot(`book-a-call-${l}-desktop`, pre(l) + '/book-a-call/', { act: pick });
  await shot(`book-a-call-${l}-mobile`, pre(l) + '/book-a-call/', { w: 390, h: 844, act: pick });
}
await shot('home-truststrip-en', '/', { full: false, act: async (p) => { await p.locator('.tstrip').scrollIntoViewIfNeeded(); await p.locator('.tstrip').screenshot({ path: `${out}/home-truststrip-en.png` }); } });
await shot('pricing-trust-he', '/he/pricing/', { full: false, act: async (p) => { await p.locator('.ptrust').scrollIntoViewIfNeeded(); await p.locator('.ptrust').screenshot({ path: `${out}/pricing-trust-he.png` }); } });
await browser.close();
