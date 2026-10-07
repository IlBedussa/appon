// Selezione automatica della lingua all'ingresso (logica condivisa, senza dipendenze).
// Usata da: Vercel Edge Middleware (scripts/vercel-geo.mjs la impacchetta in .vercel/output),
// anteprima locale (scripts/preview-geo.mjs) e test (scripts/test-geo.mjs).
//
// Regole:
// - agisce SOLO sulle pagine inglesi senza prefisso ("/", "/pricing/", "/cities/jerusalem/"…) presenti nella mappa
//   generata in build dagli hreflang; /he/, /fr/, /it/ sono una scelta esplicita e non vengono mai toccati;
// - solo all'ingresso: niente redirect se il Referer è dello stesso sito (navigazione interna);
// - mai per bot/crawler/strumenti (UA vuoto o riconosciuto), mai con ?lang=… , solo GET/HEAD;
// - priorità: cookie eb_lang (scelta manuale) → Accept-Language → paese (x-vercel-ip-country) → inglese;
// - destinazione = stessa pagina nella lingua scelta (mai una pagina inglese → niente loop).

export const LANGS = /** @type {const} */ (['en', 'he', 'fr', 'it']);
export const DEFAULT_LANG = 'en';
export const COOKIE = 'eb_lang';

/** UA di bot, crawler, anteprime link, strumenti SEO/performance e client senza browser. */
export const BOT_RE =
  /bot\b|bot[\/;-]|crawl|spider|slurp|mediapartners|adsbot|googlebot|google-inspectiontool|storebot|bingbot|bingpreview|duckduck|baiduspider|yandex|sogou|exabot|seznam|petalbot|applebot|facebookexternalhit|facebookcatalog|meta-externalagent|twitterbot|linkedinbot|pinterest|slackbot|slack-imgproxy|discordbot|telegrambot|whatsapp|skypeuripreview|embedly|quora link preview|redditbot|vkshare|semrush|ahrefs|mj12|dotbot|rogerbot|screaming frog|sitebulb|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|headlesschrome|phantomjs|prerender|python-requests|python-urllib|aiohttp|httpx|go-http-client|okhttp|java\/|libwww|wget|curl\/|^node$|node-fetch|undici|axios|postman|insomnia|gptbot|chatgpt|oai-searchbot|claudebot|claude-web|anthropic|perplexity|ccbot|bytespider|amazonbot|diffbot|archive\.org|ia_archiver|validator|feedfetcher|vercel-screenshot|vercelbot/i;

export const isBot = (ua) => !ua || BOT_RE.test(ua);

/** Normalizza un codice lingua: "iw" (vecchio codice) = ebraico. Ritorna una lingua del sito o null. */
export function normLang(tag) {
  if (!tag) return null;
  const p = String(tag).trim().toLowerCase().split(/[-_]/)[0];
  const l = p === 'iw' ? 'he' : p;
  return LANGS.includes(l) ? l : null;
}

/** Miglior lingua del sito secondo Accept-Language (rispetta q, a parità vince l'ordine). */
export function fromAcceptLanguage(header) {
  if (!header) return null;
  const items = String(header)
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';');
      const qp = params.map((s) => s.trim()).find((s) => s.startsWith('q='));
      const q = qp ? Number(qp.slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0, i };
    })
    .filter((x) => x.tag && x.tag !== '*' && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const x of items) {
    const l = normLang(x.tag);
    if (l) return l;
  }
  return null;
}

/** Paese (ISO 3166-1 alpha-2) → lingua. CH → francese (accettabile per il sito). */
export function fromCountry(cc) {
  const c = String(cc || '').trim().toUpperCase();
  if (!c) return null;
  if (c === 'IL') return 'he';
  if (['IT', 'SM', 'VA'].includes(c)) return 'it';
  if (['FR', 'BE', 'LU', 'MC', 'CH'].includes(c)) return 'fr';
  return 'en';
}

/** Legge un cookie da un header Cookie. */
export function readCookie(header, name) {
  if (!header) return null;
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return part.slice(i + 1).trim(); }
    }
  }
  return null;
}

/**
 * Decide se reindirizzare.
 * @param {object} o
 * @param {string} o.method
 * @param {string} o.url        URL completo della richiesta
 * @param {(name: string) => string | null | undefined} o.header  lettura header (case-insensitive)
 * @param {Record<string, Partial<Record<string, string>>>} o.map  percorso EN → { he, fr, it }
 * @param {boolean} [o.allowGeoParam]  accetta ?geo=XX (solo fuori produzione)
 * @returns {{ location: string | null, lang: string | null, reason: string }}
 */
export function decide({ method, url, header, map, allowGeoParam = false }) {
  const no = (reason, lang = null) => ({ location: null, lang, reason });
  const m = (method || 'GET').toUpperCase();
  if (m !== 'GET' && m !== 'HEAD') return no('method');
  const u = new URL(url);
  let path = u.pathname;
  if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) path += '/';
  const entry = map[path];
  if (!entry) return no('not-an-entry-page');
  if (u.searchParams.has('lang')) return no('explicit-lang-param');
  if (isBot(header('user-agent'))) return no('bot');
  // Prefetch/prerender del browser: non decidere al posto dell'utente.
  const purpose = (header('sec-purpose') || header('purpose') || '').toLowerCase();
  if (purpose.includes('prefetch') || purpose.includes('prerender')) return no('prefetch');
  // Solo all'ingresso: se arriva da una pagina del sito stesso è una navigazione interna (es. link "EN" nel footer).
  const ref = header('referer');
  if (ref) {
    try { if (new URL(ref).host === u.host) return no('internal-navigation'); } catch { /* referer non valido: ignora */ }
  }
  let lang = normLang(readCookie(header('cookie'), COOKIE));
  let reason = 'cookie';
  if (!lang) { lang = fromAcceptLanguage(header('accept-language')); reason = 'accept-language'; }
  if (!lang) {
    const geo = (allowGeoParam && u.searchParams.get('geo')) || header('x-vercel-ip-country');
    lang = fromCountry(geo); reason = 'country';
  }
  if (!lang) { lang = DEFAULT_LANG; reason = 'default'; }
  if (lang === DEFAULT_LANG) return no(reason + ':en', lang);
  const target = entry[lang];
  if (!target || target === path) return no(reason + ':no-translation', lang);
  const qs = new URLSearchParams(u.search);
  qs.delete('geo');
  const q = qs.toString();
  return { location: target + (q ? '?' + q : ''), lang, reason };
}

/** Header da aggiungere a ogni risposta delle pagine d'ingresso (redirect o no). */
export const VARY = 'Accept-Language, Cookie';
