// Screenshot full-page del sito (richiede il server su http://localhost:4321).
// Uso: npm run screenshots   (variabili opzionali: BASE_URL, CHROME_PATH)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const shots = (process.argv[2] ? JSON.parse(process.argv[2]) : null) ?? [
  // [file, percorso, larghezza, (opzionale) hash del pannello della dashboard, (opzionale) azione: 'rent' | 'chat']
  ['en-home-desktop.png', '/', 1280],
  ['en-home-mobile.png', '/', 390],
  ['fr-home-desktop.png', '/fr/', 1280],
  ['fr-home-mobile.png', '/fr/', 390],
  ['he-home-desktop.png', '/he/', 1280],
  ['he-home-mobile.png', '/he/', 390],
  ['it-home-desktop.png', '/it/', 1280],
  ['en-pricing-desktop.png', '/pricing/', 1280],
  ['en-pricing-mobile.png', '/pricing/', 390],
  ['en-yield-desktop.png', '/tools/yield-calculator/', 1280],
  ['en-yield-mobile.png', '/tools/yield-calculator/', 390],
  ['en-city-jerusalem-desktop.png', '/cities/jerusalem/', 1280],
  ['en-city-jerusalem-mobile.png', '/cities/jerusalem/', 390],
  ['en-rent-estimate-desktop.png', '/rent-estimate/', 1280, null, 'rent'],
  ['en-rent-estimate-mobile.png', '/rent-estimate/', 390, null, 'rent'],
  ['he-rent-estimate-desktop.png', '/he/rent-estimate/', 1280, null, 'rent'],
  ['en-chat-widget-desktop.png', '/', 1280, null, 'chat'],
  ['en-chat-widget-mobile.png', '/', 390, null, 'chat'],
  ['en-care-desktop.png', '/care/', 1280],
  ['en-developers-desktop.png', '/developers/', 1280],
  ['en-guide-desktop.png', '/guide/owning-from-abroad/', 1280],
  ['fr-pricing-desktop.png', '/fr/pricing/', 1280],
  ['en-legal-tax-desktop.png', '/legal-tax/', 1280],
  ['en-legal-tax-mobile.png', '/legal-tax/', 390],
  ['he-legal-tax-desktop.png', '/he/legal-tax/', 1280],
  ['en-blog-desktop.png', '/blog/', 1280],
  ['fr-blog-desktop.png', '/fr/blog/', 1280],
  ['en-blog-article-desktop.png', '/blog/israel-fair-rental-law-landlords-guide/', 1280],
  ['en-blog-article-mobile.png', '/blog/israel-fair-rental-law-landlords-guide/', 390],
  // Diagrammi dei flussi (solo la sezione; loghi istituzionali visibili solo con SHOW_TEST_LOGOS=1)
  ['en-maintenance-bot-desktop.png', '/', 1440, null, 'el:#maintenance-bot'],
  ['en-maintenance-bot-mobile.png', '/', 390, null, 'el:#maintenance-bot'],
  ['he-maintenance-bot-desktop.png', '/he/', 1440, null, 'el:#maintenance-bot'],
  ['en-workflows-desktop.png', '/', 1440, null, 'el:#workflows'],
  ['en-workflow-maintenance-desktop.png', '/', 1440, null, 'el:#workflows .wf-board >> nth=0'],
  ['en-workflow-money-data-desktop.png', '/', 1440, null, 'el:#workflows .wf-board >> nth=1'],
  ['en-workflows-mobile.png', '/', 390, null, 'el:#workflows'],
  ['he-workflows-desktop.png', '/he/', 1440, null, 'el:#workflows'],
  ['fr-workflows-desktop.png', '/fr/', 1440, null, 'el:#workflows'],
  ['en-tenants-workflow-desktop.png', '/tenants/', 1440, null, 'el:#workflows'],
  ['en-technology-desktop.png', '/technology/', 1280],
  ['en-dashboard-overview-desktop.png', '/portal/demo/', 1280, 'overview'],
  ['fr-dashboard-desktop.png', '/fr/portal/demo/', 1280, 'overview'],
  ['he-dashboard-desktop.png', '/he/portal/demo/', 1280, 'overview'],
  // Hub Legale & Fiscale e sezione "Verificabile" (logo Corporations Authority solo con SHOW_TEST_LOGOS=1)
  ['en-legal-tax-tablet.png', '/legal-tax/', 768],
  ['it-legal-tax-desktop-1440.png', '/it/legal-tax/', 1440],
  ['fr-legal-tax-mobile.png', '/fr/legal-tax/', 390],
  ['en-trust-desktop.png', '/', 1280, null, 'el:#verify'],
  ['he-trust-desktop.png', '/he/', 1280, null, 'el:#verify'],
  ['he-home-tablet.png', '/he/', 768],
  ['it-home-desktop-1440.png', '/it/', 1440],
];
mkdirSync('screenshots', { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
// Azioni prima dello scatto: compilare la stima affitto o percorrere la chat fino al risultato.
async function act(page, action) {
  if (action === 'rent') {
    await page.selectOption('#rf-city', 'jerusalem');
    await page.fill('#rf-nb', 'Rehavia');
    await page.selectOption('#rf-rooms', '3.5');
    await page.fill('#rf-sqm', '85');
    await page.fill('#rf-floor', '3');
    for (const n of ['elevator', 'mamad', 'balcony']) await page.check(`input[name=${n}]`, { force: true });
    await page.click('.rent-form__submit');
    await page.waitForSelector('.rent-result.has-result', { timeout: 10000 });
  }
  if (action === 'chat') {
    await page.click('.rchat__launcher');
    const q = (label) => page.locator('.rchat__input button', { hasText: label }).first().click();
    await page.locator('.rchat__qbtn').first().click(); // città
    await page.locator('.rchat__input .btn--secondary').click(); // salta quartiere
    await page.locator('.rchat__input .btn--secondary').click(); // salta via
    await q('3.5');
    await page.fill('.rchat__input input', '80'); await page.keyboard.press('Enter');
    await page.fill('.rchat__input input', '2'); await page.keyboard.press('Enter');
    await page.locator('.rchat__qbtn').nth(2).click(); // mamad
    await page.locator('.rchat__input .btn--primary').click(); // fatto
    await page.locator('.rchat__qbtn').nth(1).click(); // buono
    await page.waitForSelector('.rchat__details', { timeout: 10000 });
    await page.locator('.rchat__details summary').click();
    // Mostra il messaggio con la forchetta e l'inizio del dettaglio (metodo, comparabili di esempio).
    await page.evaluate(() => { const l = document.querySelector('.rchat__log'); const m = l.querySelector('.rchat__msg--wide').previousElementSibling; l.scrollTop = m.offsetTop - l.offsetTop - 8; });
  }
}
for (const [file, path, width, hash, action] of shots) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: width < 500 ? 2 : action?.startsWith('el:') ? 2 : 1, reducedMotion: action?.startsWith('el:') ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage();
  // Il popup lead non deve comparire negli screenshot delle pagine (ha il suo script: screenshots-popup.mjs).
  await page.addInitScript(() => { try { localStorage.setItem('eb_lp', JSON.stringify({ done: true })); } catch {} });
  await page.goto(BASE + path + (hash ? `#${hash}` : ''), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  // Scatto di un singolo elemento (es. diagrammi): intestazione fissa nascosta, animazioni lasciate attive.
  if (action?.startsWith('el:')) {
    await page.evaluate(() => { document.querySelectorAll('.site-header, [class^=rchat]').forEach((e) => e.style.setProperty('visibility', 'hidden')); document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in')); });
    const el = page.locator(action.slice(3)).first();
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(action.includes('maintenance-bot') ? 6800 : 700);
    await el.screenshot({ path: `screenshots/${file}` });
    console.log('✓', file); await ctx.close(); continue;
  }
  if (action) await act(page, action);
  if (action && action !== 'chat') await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  // La chat è fissa in basso: per lei si scatta solo il viewport.
  await page.screenshot({ path: `screenshots/${file}`, fullPage: action !== 'chat' });
  console.log('✓', file);
  await ctx.close();
}
await browser.close();
