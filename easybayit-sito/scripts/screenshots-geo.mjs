import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
// Screenshot header senza selettore lingua (EN desktop, HE mobile) + riga lingue nel footer,
// e prova end-to-end nel browser: redirect all'ingresso + cookie eb_lang dal footer.
// Richiede `npm run preview:geo` su BASE_URL (default http://localhost:4321).
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const out = 'screenshots';
mkdirSync(out, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const UA_M = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ok = (c, m) => { console.log(c ? '✓' : '✗', m); if (!c) process.exitCode = 1; };
const noPopup = (c) => c.addInitScript(() => localStorage.setItem('eb_lp', JSON.stringify({ done: true, last: Date.now() })));

// EN desktop
{ const c = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA, locale: 'en-US' }); await noPopup(c); const p = await c.newPage();
  const r = await p.goto(`${BASE}/`); ok(new URL(p.url()).pathname === '/' && r.status() === 200, 'EN: resta su /');
  ok(!(await p.locator('header .lang, header [hreflang]').count()), 'EN desktop: nessun selettore lingua nell\'header');
  await p.screenshot({ path: `${out}/geo-header-en-desktop.png`, clip: { x: 0, y: 0, width: 1440, height: 160 } });
  const row = p.locator('.site-footer__bottom'); await row.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await row.screenshot({ path: `${out}/geo-footer-langs-en-desktop.png` });
  await c.close(); }
// HE mobile: ingresso con Accept-Language he → /he/
{ const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: UA_M, locale: 'he-IL' }); await noPopup(c); const p = await c.newPage();
  await p.goto(`${BASE}/pricing/`); ok(new URL(p.url()).pathname === '/he/pricing/', `he-IL su /pricing/ → ${new URL(p.url()).pathname}`);
  await p.goto(`${BASE}/he/`);
  await p.screenshot({ path: `${out}/geo-header-he-mobile.png`, clip: { x: 0, y: 0, width: 390, height: 120 } });
  await p.click('.menu-btn'); await p.waitForTimeout(300);
  ok(!(await p.locator('#site-menu .lang, #site-menu [hreflang]').count()), 'HE mobile: nessun selettore lingua nel menu');
  await p.screenshot({ path: `${out}/geo-header-he-mobile-menu.png` });
  await p.click('.menu-btn');
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/geo-footer-langs-he-mobile.png` });
  // Scelta manuale EN dal footer → cookie e niente redirect, anche a un nuovo ingresso.
  await p.click('.site-footer__langs a[data-eb-lang="en"]'); await p.waitForLoadState();
  ok(new URL(p.url()).pathname === '/', `click EN nel footer → ${new URL(p.url()).pathname}`);
  const ck = (await c.cookies()).find((k) => k.name === 'eb_lang');
  ok(ck?.value === 'en' && ck.expires > Date.now() / 1000 + 300 * 86400, `cookie eb_lang=${ck?.value} (1 anno)`);
  const p2 = await c.newPage(); await p2.goto(`${BASE}/pricing/`);
  ok(new URL(p2.url()).pathname === '/pricing/', `nuovo ingresso con cookie en e Accept-Language he → ${new URL(p2.url()).pathname}`);
  // Cookie it → al prossimo ingresso vince sull'Accept-Language.
  await p2.goto(`${BASE}/`); await p2.click('.site-footer__langs a[data-eb-lang="it"]'); await p2.waitForLoadState();
  const p3 = await c.newPage(); await p3.goto(`${BASE}/`);
  ok(new URL(p3.url()).pathname === '/it/', `cookie it vince → ${new URL(p3.url()).pathname}`);
  await c.close(); }
// ?geo=IT senza Accept-Language utile (simulazione paese)
{ const c = await b.newContext({ userAgent: UA, locale: 'de-DE' }); const p = await c.newPage();
  await p.goto(`${BASE}/cities/jerusalem/?geo=IT`); ok(new URL(p.url()).pathname === '/it/cities/jerusalem/', `de-DE + ?geo=IT → ${new URL(p.url()).pathname}`);
  await c.close(); }
await b.close();
