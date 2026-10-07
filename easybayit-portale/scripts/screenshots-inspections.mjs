// Screenshot delle ispezioni e dei PDF (ispezione + report mensile). Richiede db:reset + seed + dev server.
// Output: ../easybayit/screenshots/trust-batch/portal-*.png (e PDF di esempio in /tmp per la conversione).
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { launch, loginContext, BASE } from './lib/browser.mjs';
import { env } from './lib/env.mjs';

const out = process.env.SHOTS_DIR ?? new URL('../../easybayit/screenshots/trust-batch/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const sb = createClient(env.url, env.service, { auth: { persistSession: false } });
const { data: ins } = await sb.from('inspections').select('id, status, property_id').order('created_at');
const done = ins.find((i) => i.status === 'completed'), draft = ins.find((i) => i.status === 'draft');
const browser = await launch();
const shot = async (page, name, full = true) => {
  // le foto sono in lazy loading: scorre la pagina per caricarle prima dello scatto a pagina intera
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
  await page.waitForLoadState('networkidle').catch(() => {}); await page.screenshot({ path: `${out}/${name}.png`, fullPage: full }); console.log('📸', name); };
const pdfShot = async (page, url, name, pages = 1) => {
  const r = await page.request.get(url);
  const buf = await r.body();
  if (!buf.subarray(0, 5).toString().startsWith('%PDF')) throw new Error(`${url}: not a PDF (${r.status()})`);
  writeFileSync(`/tmp/${name}.pdf`, buf);
  execFileSync('pdftoppm', ['-png', '-r', '80', '-f', '1', '-l', String(pages), `/tmp/${name}.pdf`, `${out}/${name}`]);
  console.log('📄', name);
};

{ // staff: elenco, bozza (strumenti di compilazione), completata
  const { ctx, page } = await loginContext(browser, 'staff');
  await page.goto(`${BASE}/admin/inspections`); await shot(page, 'portal-admin-inspections-en');
  await page.goto(`${BASE}/admin/inspections/${draft.id}`); await shot(page, 'portal-admin-inspection-draft-en');
  await ctx.close();
}
for (const lang of ['en', 'he', 'it']) { // proprietario: dettaglio con conferma da dare
  const { ctx, page } = await loginContext(browser, 'owner1', { locale: lang });
  await page.goto(`${BASE}/owner/inspections`); await shot(page, `portal-owner-inspections-${lang}`);
  await page.goto(`${BASE}/owner/inspections/${done.id}`); await shot(page, `portal-owner-inspection-${lang}`);
  if (lang !== 'it') await pdfShot(page, `${BASE}/owner/inspections/${done.id}/pdf`, `portal-inspection-pdf-${lang}`, 2);
  const month = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  if (lang !== 'it') await pdfShot(page, `${BASE}/owner/properties/${done.property_id}/report.pdf?month=${month}`, `portal-health-report-pdf-${lang}`);
  if (lang === 'en') { await page.goto(`${BASE}/owner/properties`); await shot(page, 'portal-owner-properties-report-en'); }
  await ctx.close();
}
{ // inquilino: già confermato; mobile
  const m = await loginContext(browser, 'tenant1', { locale: 'en', viewport: { width: 390, height: 844 } });
  await m.page.goto(`${BASE}/tenant/inspections/${done.id}`); await shot(m.page, 'portal-tenant-inspection-mobile-en');
  await m.ctx.close();
  const h = await loginContext(browser, 'tenant1', { locale: 'he', viewport: { width: 390, height: 844 } });
  await h.page.goto(`${BASE}/tenant/inspections`); await shot(h.page, 'portal-tenant-inspections-mobile-he');
  await h.ctx.close();
}
await browser.close();
