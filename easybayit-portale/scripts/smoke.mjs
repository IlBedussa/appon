// Smoke test: visita le pagine principali per ogni ruolo e segnala errori HTTP o pagine di errore.
import { launch, loginContext, BASE } from './lib/browser.mjs';
const routes = {
  admin: ['/admin', '/admin/owners', '/admin/tenants', '/admin/properties', '/admin/leases', '/admin/statements', '/admin/maintenance', '/admin/documents', '/admin/payments', '/admin/metrics', '/admin/users', '/admin/audit', '/security', '/notifications'],
  owner1: ['/owner', '/owner/properties', '/owner/statements', '/owner/maintenance', '/owner/documents', '/owner/payments', '/security', '/notifications'],
  tenant1: ['/tenant', '/tenant/requests', '/tenant/requests/new', '/tenant/documents', '/tenant/payments', '/security'],
};
const browser = await launch();
let bad = 0;
for (const [who, list] of Object.entries(routes)) {
  const { ctx, page } = await loginContext(browser, who);
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  for (const r of list) {
    const res = await page.goto(BASE + r);
    const status = res?.status();
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    const ok = status === 200 && !/error|errore|not found/i.test(h1 ?? '');
    if (!ok) bad++;
    console.log(`${ok ? '✓' : '✗'} ${who} ${r} ${status} ${h1?.trim()}`);
  }
  // pagine di dettaglio: prima riga della lista
  for (const listUrl of who === 'admin' ? ['/admin/maintenance', '/admin/statements'] : who === 'owner1' ? ['/owner/maintenance', '/owner/statements'] : ['/tenant/requests']) {
    await page.goto(BASE + listUrl);
    const href = await page.locator(`main a[href^="${listUrl}/"]`).first().getAttribute('href').catch(() => null);
    if (href) { const res = await page.goto(BASE + href); console.log(`${res?.status() === 200 ? '✓' : '✗'} ${who} ${href} ${res?.status()}`); if (res?.status() !== 200) bad++; }
  }
  if (errs.length) console.log('  console errors:', [...new Set(errs)].slice(0, 5));
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
