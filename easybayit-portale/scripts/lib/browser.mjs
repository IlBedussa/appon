// Helper Playwright (playwright-core + Chrome di sistema) per smoke test e screenshot.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { totp } from './totp.mjs';

export const BASE = process.env.SITE_URL ?? 'http://localhost:4322';
export const creds = () => JSON.parse(readFileSync(new URL('../../.local-credentials.json', import.meta.url), 'utf8'));
export const cred = (key) => creds().find((c) => c.key === key);

export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
}

/** Login completo (password + eventuale 2FA) in un nuovo contesto. */
export async function loginContext(browser, key, { locale = 'en', viewport = { width: 1360, height: 900 } } = {}) {
  const c = cred(key);
  const ctx = await browser.newContext({ viewport, locale: locale === 'he' ? 'he-IL' : locale });
  await ctx.addCookies([{ name: 'eb_lang', value: locale, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[name=email]', c.email);
  await page.fill('input[name=password]', c.password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]);
  if (new URL(page.url()).pathname.startsWith('/mfa')) {
    // evita di riusare un codice nello stesso intervallo di 30 s
    await page.fill('input[name=code]', totp(c.totpSecret));
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/mfa')), page.click('button[type=submit]')]);
  }
  return { ctx, page };
}
