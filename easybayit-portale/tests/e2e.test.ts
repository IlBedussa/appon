// Test end-to-end via browser (Chrome + playwright-core) contro il server di sviluppo su :4322.
// Richiede: npm run db:reset && npm run dev. Se il server non risponde i test vengono saltati.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { launch, loginContext, BASE } from '../scripts/lib/browser.mjs';
import { as, service, cred } from './helpers';

const up = await fetch(`${BASE}/login`).then((r) => r.ok).catch(() => false);
const d = up ? describe : describe.skip;
let browser: Browser;
beforeAll(async () => { if (up) browser = await launch(); });
afterAll(async () => {
  await browser?.close();
  if (up) await service().from('maintenance_requests').delete().in('title', ['E2E: door lock', 'E2E: bathroom fan broken']);
});
const fixture = (f: string) => fileURLToPath(new URL(`../scripts/fixtures/${f}`, import.meta.url));

d('sicurezza HTTP', () => {
  it('header di sicurezza e CSP', async () => {
    const r = await fetch(`${BASE}/login`);
    // la CSP completa con hash (default-src, script-src…) è generata da Astro solo nella build di produzione
    const html = await r.text();
    if (!/astro-dev-toolbar|@vite\/client/.test(html)) expect(html + r.headers.get('content-security-policy')).toMatch(/default-src 'self'/);
    expect(r.headers.get('content-security-policy')).toMatch(/frame-ancestors 'none'/);
    expect(r.headers.get('x-content-type-options')).toBe('nosniff');
    expect(r.headers.get('x-frame-options')).toBe('DENY');
    expect(r.headers.get('referrer-policy')).toBeTruthy();
  });
  it('POST senza token CSRF rifiutato', async () => {
    const r = await fetch(`${BASE}/login`, { method: 'POST', body: new URLSearchParams({ email: 'a@b.test', password: 'x' }), redirect: 'manual' });
    expect(r.status).toBe(403);
  });
  it('pagine protette reindirizzano al login', async () => {
    const r = await fetch(`${BASE}/owner`, { redirect: 'manual' });
    expect([302, 303]).toContain(r.status);
    expect(r.headers.get('location')).toMatch(/\/login/);
  });
});

d('flussi principali', () => {
  it('lo staff entra solo dopo la 2FA; un proprietario non accede al back-office', async () => {
    const { ctx, page } = await loginContext(browser, 'staff');
    expect(new URL(page.url()).pathname).toBe('/admin');
    await ctx.close();
    const o = await loginContext(browser, 'owner1');
    const res = await o.page.goto(`${BASE}/admin/users`);
    expect(new URL(o.page.url()).pathname === '/owner' || res!.status() === 404).toBe(true);
    await o.ctx.close();
  });
  it("l'inquilino apre una richiesta con foto e video", async () => {
    const { ctx, page } = await loginContext(browser, 'tenant1');
    await page.goto(`${BASE}/tenant/requests/new`);
    await page.fill('input[name=title]', 'E2E: bathroom fan broken');
    await page.fill('textarea[name=description]', 'The fan makes a loud noise and stopped working.');
    await page.setInputFiles('input[name=photos]', [fixture('heater-1.png'), fixture('demo-leak.mp4')]);
    await Promise.all([page.waitForURL(/\/tenant\/requests\/[0-9a-f-]{36}/), page.click('[data-testid=request-form] button[type=submit]')]);
    expect(await page.locator('[data-testid=media-grid] video').count()).toBe(1);
    expect(await page.locator('[data-testid=media-grid] img').count()).toBe(1);
    await ctx.close();
    const { data } = await service().from('maintenance_requests').select('id, maintenance_photos(media_type)').eq('title', 'E2E: bathroom fan broken').single();
    expect(data!.maintenance_photos.map((m: any) => m.media_type).sort()).toEqual(['image', 'video']);
    await service().from('maintenance_requests').delete().eq('id', data!.id);
  });
  it("upload diretto dal browser: foto aggiunta a una richiesta con avanzamento; file troppo grande fermato prima dell'invio (in ebraico)", async () => {
    const db = service();
    const { data: req } = await db.from('maintenance_requests').select('id').eq('title', 'Water heater not working').single();
    const before = (await db.from('maintenance_photos').select('id').eq('request_id', req!.id)).data!.map((x) => x.id);
    const { ctx, page } = await loginContext(browser, 'tenant1');
    await page.goto(`${BASE}/tenant/requests/${req!.id}`);
    const signCalls: string[] = [];
    page.on('request', (r: { url(): string }) => { if (r.url().includes('/api/uploads/sign')) signCalls.push(r.url()); });
    await page.setInputFiles('input[name=photos]', fixture('tap-1.jpg'));
    expect(await page.locator('[data-du-list] li').count()).toBe(1);
    await Promise.all([page.waitForURL(`${BASE}/tenant/requests/${req!.id}`, { waitUntil: 'load' }), page.click('form:has(input[name=photos]) button[type=submit]')]);
    await page.waitForLoadState('load');
    expect(await page.locator('.flash').first().getAttribute('data-type')).toBe('success');
    expect(signCalls).toHaveLength(1);
    const after = (await db.from('maintenance_photos').select('id, storage_path, sha256').eq('request_id', req!.id)).data!;
    const added = after.filter((x) => !before.includes(x.id));
    expect(added).toHaveLength(1);
    expect(added[0].sha256).toBe(createHash('sha256').update(readFileSync(fixture('tap-1.jpg'))).digest('hex'));
    await db.storage.from('maintenance-photos').remove([added[0].storage_path]);
    await db.from('maintenance_photos').delete().eq('id', added[0].id);
    await ctx.close();

    const he = await loginContext(browser, 'tenant1', { locale: 'he' });
    await he.page.goto(`${BASE}/tenant/requests/${req!.id}`);
    const calls: string[] = [];
    he.page.on('request', (r: { url(): string }) => { if (r.url().includes('/api/uploads/')) calls.push(r.url()); });
    await he.page.setInputFiles('input[name=photos]', { name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(9 * 1024 * 1024, 0xff) });
    await he.page.click('form:has(input[name=photos]) button[type=submit]');
    const status = he.page.locator('[data-du-status]');
    await status.waitFor({ state: 'visible' });
    expect(await status.getAttribute('data-type')).toBe('error');
    expect(await status.textContent()).toMatch(/גדול מדי/);
    expect(calls).toHaveLength(0);
    await he.ctx.close();
  });
  it('web chat: allegato caricato direttamente sullo storage e consegnato al bot', async () => {
    const { ctx, page } = await loginContext(browser, 'tenant1');
    const { data: prof } = await service().from('profiles').select('id').eq('email', cred('tenant1').email).single();
    await service().from('chat_conversations').delete().eq('external_id', prof!.id);
    await page.goto(`${BASE}/tenant/chat`);
    await page.setInputFiles('#chat-file', fixture('tap-1.jpg'));
    await page.locator('.bubble.me', { hasText: '📎' }).first().waitFor({ timeout: 20_000 });
    expect(await page.locator('#chat-upload').isHidden()).toBe(true);
    const { count } = await service().from('upload_intents').select('id', { count: 'exact', head: true }).eq('created_by', prof!.id).eq('kind', 'webchat').eq('status', 'finalized');
    expect(count).toBeGreaterThanOrEqual(1);
    await ctx.close();
    await service().from('chat_conversations').delete().eq('external_id', prof!.id);
  });
  it('il proprietario approva un preventivo con un clic', async () => {
    const staff = await as('staff');
    const { data: p } = await staff.from('properties').select('id').eq('code', 'TLV-02').single();
    const { data: req } = await staff.from('maintenance_requests').insert({ property_id: p!.id, title: 'E2E: door lock', description: 'x', priority: 'routine' }).select().single();
    await staff.from('quotes').insert({ request_id: req!.id, supplier: 'E2E Locksmith', items: [{ label: 'Lock', amount: 1900 }], total_ils: 1900 });
    const { ctx, page } = await loginContext(browser, 'owner1');
    await page.goto(`${BASE}/owner/maintenance/${req!.id}`);
    await Promise.all([page.waitForNavigation(), page.click('[data-testid=approve-quote]')]);
    expect(await page.locator('.flash').first().getAttribute('data-type')).toBe('success');
    const { data: q } = await staff.from('quotes').select('status, decided_by').eq('request_id', req!.id).single();
    expect(q!.status).toBe('approved');
    expect(q!.decided_by).toBeTruthy();
    await ctx.close();
    await service().from('maintenance_requests').delete().eq('id', req!.id);
  });
  it('download PDF del rendiconto', async () => {
    const { ctx, page } = await loginContext(browser, 'owner1');
    await page.goto(`${BASE}/owner/statements`);
    const href = await page.locator('main a[href^="/owner/statements/"]').first().getAttribute('href');
    const r = await ctx.request.get(`${BASE}${href}/pdf`);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toBe('application/pdf');
    expect((await r.body()).subarray(0, 5).toString()).toBe('%PDF-');
    await ctx.close();
  });
  it('lingue: francese LTR, ebraico RTL', async () => {
    const fr = await loginContext(browser, 'owner1', { locale: 'fr' });
    expect(await fr.page.locator('html').getAttribute('lang')).toBe('fr');
    expect(await fr.page.locator('h1').first().textContent()).toMatch(/Vue d'ensemble/);
    await fr.ctx.close();
    const he = await loginContext(browser, 'owner1', { locale: 'he' });
    expect(await he.page.locator('html').getAttribute('dir')).toBe('rtl');
    await he.ctx.close();
  });
  it('reset password via email (Mailpit locale) e nuovo login', async () => {
    const MAIL = 'http://127.0.0.1:54324/api/v1';
    const c = (await import('./helpers')).cred('tenant3');
    await fetch(`${MAIL}/messages`, { method: 'DELETE' });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/forgot-password`);
    await page.fill('input[name=email]', c.email);
    await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
    let id = '';
    await expect.poll(async () => {
      const m = await fetch(`${MAIL}/search?query=${encodeURIComponent('to:' + c.email)}`).then((r) => r.json());
      id = m.messages?.[0]?.ID ?? '';
      return id;
    }, { timeout: 15000 }).not.toBe('');
    const msg = await fetch(`${MAIL}/message/${id}`).then((r) => r.json());
    const link = /href="([^"]*\/auth\/confirm\?[^"]+)"/.exec(msg.HTML)![1].replaceAll('&amp;', '&');
    await page.goto(link);
    expect(new URL(page.url()).pathname).toBe('/set-password');
    const np = 'Reset-Tenant3-2026x';
    await page.fill('input[name=password]', np);
    await page.fill('input[name=password2]', np);
    await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
    expect(new URL(page.url()).pathname).toBe('/tenant');
    await ctx.close();
    // ripristino della password del seed
    const { data: u } = await service().from('profiles').select('id').eq('email', c.email).single();
    await service().auth.admin.updateUserById(u!.id, { password: c.password });
  });
  it("invito di un nuovo utente dall'amministrazione (email catturata in locale)", async () => {
    const email = 'invitee-e2e@example.test';
    const { ctx, page } = await loginContext(browser, 'admin');
    await page.goto(`${BASE}/admin/users`);
    await page.click('details.create summary');
    await page.fill('input[name=email]', email);
    await page.fill('input[name=full_name]', 'Invitee E2E (demo)');
    await page.selectOption('select[name=role]', 'owner');
    await page.selectOption('select[name=locale]', 'fr');
    await Promise.all([page.waitForNavigation(), page.click('details.create button[type=submit]')]);
    expect(await page.locator('.flash').first().getAttribute('data-type')).toBe('success');
    await ctx.close();
    await expect.poll(async () => (await fetch(`http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent('to:' + email)}`).then((r) => r.json())).messages_count ?? 0, { timeout: 15000 }).toBeGreaterThan(0);
    const { data: prof } = await service().from('profiles').select('id, role, locale').eq('email', email).single();
    expect(prof).toMatchObject({ role: 'owner', locale: 'fr' });
    await service().auth.admin.deleteUser(prof!.id);
  });
  it('blocco dopo troppi tentativi di login', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    let text = '';
    for (let i = 0; i < 6; i++) {
      await page.goto(`${BASE}/login`);
      await page.fill('input[name=email]', 'nobody-ratelimit@example.test');
      await page.fill('input[name=password]', 'Wrong-Password-1');
      await Promise.all([page.waitForNavigation(), page.click('button[type=submit]')]);
      text = (await page.locator('[role=alert]').first().textContent()) ?? '';
    }
    expect(text).toMatch(/Too many attempts/i);
    // sblocco con la stessa chiave (hash) usata dall'app
    await service().rpc('rate_limit_reset', { p_key: `login-email:${createHash('sha256').update('nobody-ratelimit@example.test').digest('hex').slice(0, 32)}` });
    await ctx.close();
  });
});
