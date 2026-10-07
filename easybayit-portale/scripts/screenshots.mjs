// Screenshot delle schermate principali (richiede db:reset + dev server). Output: screenshots/*.png
import { mkdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { launch, loginContext, cred, BASE } from './lib/browser.mjs';
import { env } from './lib/env.mjs';

const out = new URL('../screenshots/', import.meta.url);
mkdirSync(out, { recursive: true });
const sb = createClient(env.url, env.service, { auth: { persistSession: false } });
const { data: reqs } = await sb.from('maintenance_requests').select('id, title').in('title', ['Water heater not working', 'Kitchen tap leaking']);
const heater = reqs.find((r) => r.title === 'Water heater not working').id;
const tap = reqs.find((r) => r.title === 'Kitchen tap leaking').id;
const { data: st } = await sb.from('statements').select('id, owners!inner(email)').eq('owners.email', 'owner1@example.test').eq('status', 'published').order('period', { ascending: false }).limit(1).single();

const browser = await launch();
const shots = [];
const shot = async (page, name, { full = true } = {}) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  const path = new URL(`${name}.png`, out).pathname;
  await page.screenshot({ path, fullPage: full });
  shots.push(path);
  console.log('📸', path);
};

// 1. Login e 2FA
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`); await shot(page, '01-login');
  const c = cred('staff');
  await page.fill('input[name=email]', c.email); await page.fill('input[name=password]', c.password);
  await Promise.all([page.waitForURL(/\/mfa/), page.click('button[type=submit]')]);
  await shot(page, '02-mfa-challenge');
  await ctx.close();
}
// 2. Proprietario (EN)
{
  const { ctx, page } = await loginContext(browser, 'owner1');
  await page.goto(`${BASE}/owner`); await shot(page, '03-owner-dashboard');
  await page.goto(`${BASE}/owner/maintenance/${heater}`); await shot(page, '04-owner-quote-approval-photo-video');
  await page.goto(`${BASE}/owner/maintenance`); await shot(page, '05-owner-approval-threshold');
  await page.goto(`${BASE}/owner/statements/${st.id}`); await shot(page, '06-owner-statement');
  await page.goto(`${BASE}/owner/documents`); await shot(page, '07-owner-documents-expiry');
  await page.goto(`${BASE}/lang?cur=GBP&next=/owner`); await shot(page, '08-owner-dashboard-gbp');
  await page.goto(`${BASE}/lang?cur=ILS&next=/security`);
  await page.click('form:has(input[value=enroll]) button[type=submit]');
  await page.waitForLoadState('load'); await shot(page, '09-security-2fa-setup');
  await ctx.close();
}
// 3. Proprietario in ebraico (RTL) e mobile
{
  const { ctx, page } = await loginContext(browser, 'owner1', { locale: 'he' });
  await page.goto(`${BASE}/owner`); await shot(page, '10-owner-dashboard-he-rtl');
  await ctx.close();
  const m = await loginContext(browser, 'owner1', { locale: 'en', viewport: { width: 390, height: 844 } });
  await m.page.goto(`${BASE}/owner/maintenance/${heater}`); await shot(m.page, '11-owner-quote-mobile');
  await m.ctx.close();
}
// 4. Proprietario italiano con 2FA (auto-approvazione)
{
  const { ctx, page } = await loginContext(browser, 'owner2', { locale: 'it' });
  await page.goto(`${BASE}/owner/maintenance/${tap}`); await shot(page, '12-owner-it-auto-approved');
  await ctx.close();
}
// 5. Inquilino (francese)
{
  const { ctx, page } = await loginContext(browser, 'tenant2', { locale: 'fr' });
  await page.goto(`${BASE}/tenant`); await shot(page, '13-tenant-fr-lease');
  await page.goto(`${BASE}/tenant/requests/new`); await shot(page, '14-tenant-fr-new-request');
  await ctx.close();
}
// 6. Back-office
{
  const { ctx, page } = await loginContext(browser, 'admin');
  await page.goto(`${BASE}/admin`); await shot(page, '15-admin-dashboard');
  await page.goto(`${BASE}/admin/metrics`); await shot(page, '16-admin-sla-metrics');
  await page.goto(`${BASE}/admin/maintenance/${heater}`); await shot(page, '17-admin-maintenance-detail');
  await page.goto(`${BASE}/admin/statements/${st.id}`); await shot(page, '18-admin-statement-editor');
  await page.goto(`${BASE}/admin/payments`); await shot(page, '19-admin-payments');
  await page.goto(`${BASE}/admin/documents`); await shot(page, '20-admin-documents');
  await page.goto(`${BASE}/admin/users`); await shot(page, '21-admin-users');
  await page.goto(`${BASE}/admin/audit`); await shot(page, '22-admin-audit-log');
  await ctx.close();
}
await browser.close();
console.log(`✓ ${shots.length} screenshot`);
