// Preferenze di visualizzazione: lingua (?l=) e valuta (?cur=). Salvate in cookie e nel profilo.
import type { APIRoute } from 'astro';
import { COOKIE_SECURE } from 'astro:env/server';
import { isLocale } from '../i18n';
import { safeNext } from '../lib/session';

export const GET: APIRoute = async ({ url, cookies, locals, redirect }) => {
  const l = url.searchParams.get('l');
  const cur = url.searchParams.get('cur');
  const opts = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: COOKIE_SECURE, maxAge: 60 * 60 * 24 * 365 };
  const patch: Record<string, string> = {};
  if (isLocale(l)) { cookies.set('eb_lang', l, opts); patch.locale = l; }
  if (cur === 'ILS' || cur === 'USD' || cur === 'EUR' || cur === 'GBP') { cookies.set('eb_cur', cur, opts); patch.preferred_currency = cur; }
  if (locals.user && Object.keys(patch).length) await locals.supabase.from('profiles').update(patch).eq('id', locals.user.id);
  return redirect(safeNext(url.searchParams.get('next'), '/'), 303);
};
