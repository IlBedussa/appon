// Middleware: lingua, CSRF, sessione Supabase, 2FA, controllo ruoli, header di sicurezza.
// Ordine: (1) lingua e token CSRF  (2) verifica CSRF sui metodi non sicuri  (3) utente/profilo/AAL
// (4) regole di accesso  (5) render  (6) header di sicurezza + invio email in coda.
import { defineMiddleware } from 'astro:middleware';
import { COOKIE_SECURE, SITE_URL } from 'astro:env/server';
import { createUserClient } from './lib/supabase';
import { csrfCookieName, newCsrfToken, tokensMatch } from './lib/csrf';
import { takeFlash } from './lib/flash';
import { dict, fromAcceptLanguage, isLocale, langMeta } from './i18n';
import { areaAllowed, homeFor, isPublicPath, isStaffRole, type Profile } from './lib/session';
import { processOutbox } from './lib/outbox';
import { processChatOutbox } from './lib/bot/engine';
import { botConfig } from './lib/bot/config';
import { getFxRates } from './lib/fx';

// Corpo massimo delle richieste: sotto il limite di 4,5 MB delle funzioni Vercel. Foto, video e documenti
// non passano dal server: il browser li carica direttamente su Supabase Storage con URL firmati.
// (Restano piccoli multipart come l'import CSV dei pagamenti, max 2 MB.)
const MAX_BODY = 4 * 1024 * 1024;
// Simulatore WhatsApp (solo sviluppo, mai su Vercel con il provider cloud): riceve video fino a 60 MB
const MAX_BODY_SIMULATOR = 64 * 1024 * 1024;
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

function securityHeaders(input: Response, authenticated: boolean) {
  let res = input;
  try { res.headers.set('X-Content-Type-Options', 'nosniff'); } catch {
    // header immutabili (es. redirect): si crea una copia modificabile
    res = new Response(input.body, { status: input.status, statusText: input.statusText, headers: new Headers(input.headers) });
  }
  const h = res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Resource-Policy', 'same-origin');
  // La CSP con gli hash di script/stili è generata da Astro (header o meta, solo in build);
  // qui si aggiungono le direttive che non possono stare in un meta tag senza sovrascrivere quelle di Astro.
  const extra = "frame-ancestors 'none'";
  const astroCsp = h.get('Content-Security-Policy');
  h.set('Content-Security-Policy', astroCsp ? `${astroCsp.replace(/[;\s]+$/, "")}; ${extra}` : `${extra}; base-uri 'self'; form-action 'self'; object-src 'none'`);
  if (SITE_URL.startsWith('https://')) h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  if (authenticated && !h.has('Cache-Control')) h.set('Cache-Control', 'private, no-store');
  return res;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { request, cookies, url, locals } = ctx;
  const path = url.pathname.replace(/\/+$/, '') || '/';

  // File statici: nessuna logica
  if (path.startsWith('/_astro/') || path === '/favicon.svg' || path === '/robots.txt') return next();

  // Webhook WhatsApp: niente sessione né CSRF (chiamato dai server Meta); l'endpoint verifica la firma HMAC.
  if (path === '/api/whatsapp/webhook') {
    if (!SAFE.has(request.method) && Number(request.headers.get('content-length') ?? '0') > 1_000_000) return new Response('Payload too large', { status: 413 });
    return securityHeaders(await next(), false);
  }
  // Simulatore WhatsApp: esiste solo in sviluppo (o se abilitato esplicitamente, mai con il provider cloud)
  if ((path === '/dev/whatsapp-sim' || path.startsWith('/dev/whatsapp-sim/')) && !botConfig.simulatorEnabled) {
    return securityHeaders(new Response('Not found', { status: 404 }), false);
  }

  // ---- (1) Lingua iniziale (cookie > Accept-Language; il profilo la può sovrascrivere sotto) ----
  const langCookie = cookies.get('eb_lang')?.value;
  let lang = isLocale(langCookie) ? langCookie : fromAcceptLanguage(request.headers.get('accept-language'));

  // ---- Token CSRF (cookie HttpOnly; il valore viene stampato nei form dal server) ----
  const csrfName = csrfCookieName(COOKIE_SECURE);
  let csrf = cookies.get(csrfName)?.value ?? '';
  if (!/^[A-Za-z0-9_-]{40,}$/.test(csrf)) {
    csrf = newCsrfToken();
    cookies.set(csrfName, csrf, { path: '/', httpOnly: true, sameSite: 'strict', secure: COOKIE_SECURE });
  }
  try { locals.ip = ctx.clientAddress ?? 'unknown'; } catch { locals.ip = 'unknown'; }

  // ---- (2) CSRF + limite dimensione per i metodi non sicuri ----
  if (!SAFE.has(request.method) && !path.startsWith('/api/cron/')) {
    const len = Number(request.headers.get('content-length') ?? '0');
    const max = path.startsWith('/dev/whatsapp-sim/') && botConfig.simulatorEnabled ? MAX_BODY_SIMULATOR : MAX_BODY;
    if (len > max) return securityHeaders(new Response('Payload too large', { status: 413, headers: { 'content-type': 'text/plain' } }), false);
    let sent = request.headers.get('x-csrf-token');
    const ct = request.headers.get('content-type') ?? '';
    if (!sent && (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data'))) {
      try {
        const v = (await request.clone().formData()).get('_csrf');
        sent = typeof v === 'string' ? v : null;
      } catch { sent = null; }
    }
    if (!tokensMatch(sent, cookies.get(csrfName)?.value)) {
      return securityHeaders(new Response('Invalid CSRF token', { status: 403, headers: { 'content-type': 'text/plain' } }), false);
    }
  }

  // ---- (3) Sessione Supabase (il refresh del token aggiorna i cookie) ----
  const supabase = createUserClient(request, cookies);
  locals.supabase = supabase;
  locals.user = null; locals.profile = null; locals.hasMfa = false; locals.aal = { current: null, next: null };
  locals.fx = null; locals.currency = 'ILS';

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;
  if (user) {
    locals.user = user;
    const [{ data: profile }, { data: aal }] = await Promise.all([
      supabase.from('profiles').select('id, role, full_name, email, locale, preferred_currency, is_active').eq('id', user.id).maybeSingle(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    locals.profile = (profile as Profile | null) ?? null;
    locals.aal = { current: aal?.currentLevel ?? null, next: aal?.nextLevel ?? null };
    locals.hasMfa = (user.factors ?? []).some((f) => f.status === 'verified');
    if (!isLocale(langCookie) && locals.profile && isLocale(locals.profile.locale)) lang = locals.profile.locale;
  }

  locals.lang = lang;
  locals.t = dict(lang);
  locals.dir = langMeta[lang].dir;
  locals.intl = langMeta[lang].intl;
  locals.csrf = csrf;
  locals.flash = takeFlash(cookies);

  // ---- (4) Regole di accesso ----
  const redirect = (to: string) => securityHeaders(new Response(null, { status: 303, headers: { location: to } }), !!user);
  const profile = locals.profile;

  if (!isPublicPath(path)) {
    if (!user) return ctx.redirect(`/login?next=${encodeURIComponent(path + url.search)}`, 303);
    if (!profile || !profile.is_active) {
      await supabase.auth.signOut({ scope: 'local' });
      return ctx.redirect('/login?e=inactive', 303);
    }
    const needsAal2 = locals.aal.next === 'aal2' && locals.aal.current !== 'aal2';
    if (needsAal2 && path !== '/mfa' && path !== '/logout') return redirect(`/mfa?next=${encodeURIComponent(path + url.search)}`);
    // Staff/admin senza 2FA: possono solo configurarla (anche il DB nega i dati senza aal2)
    if (isStaffRole(profile.role) && !locals.hasMfa && !['/security', '/logout', '/mfa'].includes(path)) return redirect('/security?required=1');
    if (!areaAllowed(path, profile.role)) return redirect(homeFor(profile.role));
    if (path === '/') return redirect(homeFor(profile.role));

    // Valuta di visualizzazione (cookie > preferenza profilo) e cambi BOI
    const cur = cookies.get('eb_cur')?.value ?? profile.preferred_currency;
    locals.currency = cur === 'USD' || cur === 'EUR' || cur === 'GBP' ? cur : 'ILS';
    // cache in memoria + DB: costo trascurabile anche sulle risposte ai POST
    locals.fx = await getFxRates().catch(() => null);
  } else if (user && profile && (path === '/login' || path === '/forgot-password') && request.method === 'GET') {
    const needsAal2 = locals.aal.next === 'aal2' && locals.aal.current !== 'aal2';
    return redirect(needsAal2 ? '/mfa' : homeFor(profile.role));
  }

  // ---- (5) Render ----
  const res = await next();

  // ---- (6) Email in coda dopo le modifiche (non blocca la risposta) ----
  if (!SAFE.has(request.method)) {
    void processOutbox().catch((e) => console.error('[outbox]', e));
    // aggiornamenti di stato verso la chat dell'inquilino (WhatsApp / web chat) dopo le azioni dello staff
    void processChatOutbox().catch((e) => console.error('[chat-outbox]', e));
  }
  return securityHeaders(res, !!user);
});
