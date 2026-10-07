// Test della selezione automatica della lingua (src/lib/geo-lang.mjs).
// Esegue la stessa matrice su 3 livelli:
//  1) logica pura con la mappa reale (da dist/client o .vercel/output/static);
//  2) la Edge Middleware generata per Vercel (.vercel/output/functions/_geo.func), se presente, + rotta in config.json;
//  3) HTTP sull'anteprima locale (scripts/preview-geo.mjs avviata su una porta libera; oppure BASE_URL già attivo).
// Uso: npm run check:vercel && npm run build && npm run test:geo   (porta HTTP libera automatica, o GEO_PORT / BASE_URL)
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decide, fromAcceptLanguage, fromCountry, isBot } from '../src/lib/geo-lang.mjs';
import { buildGeoMap } from './geo-map.mjs';

let fail = 0, pass = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗', m); } };
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

// --- unità ---
const al = [
  ['he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7', 'he'], ['iw', 'he'], ['iw-IL,en;q=0.5', 'he'], ['he', 'he'],
  ['fr-FR,fr;q=0.9', 'fr'], ['fr-CA', 'fr'], ['fr-BE,nl;q=0.8', 'fr'], ['it-IT,it;q=0.9,en;q=0.8', 'it'], ['it-CH', 'it'],
  ['en-US,en;q=0.9,he;q=0.8', 'en'], ['en-GB', 'en'], ['de-DE,de;q=0.9', null], ['de-DE,it;q=0.5', 'it'],
  ['en;q=0.3,fr;q=0.9', 'fr'], ['*', null], ['', null], ['he;q=0,fr;q=0.1', 'fr'], ['IT', 'it'],
];
for (const [h, want] of al) ok(fromAcceptLanguage(h) === want, `Accept-Language "${h}" → ${want} (got ${fromAcceptLanguage(h)})`);
const cc = [['IL', 'he'], ['il', 'he'], ['IT', 'it'], ['SM', 'it'], ['VA', 'it'], ['FR', 'fr'], ['BE', 'fr'], ['LU', 'fr'], ['MC', 'fr'], ['CH', 'fr'], ['US', 'en'], ['DE', 'en'], ['', null]];
for (const [c, want] of cc) ok(fromCountry(c) === want, `paese ${c} → ${want}`);
for (const ua of ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Mozilla/5.0 (compatible; bingbot/2.0)',
  'facebookexternalhit/1.1', 'Twitterbot/1.0', 'Slackbot-LinkExpanding 1.0', 'WhatsApp/2.23', 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0)', 'curl/8.5.0', 'Mozilla/5.0 (compatible; AhrefsBot/7.0)', 'DuckDuckBot/1.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/129.0 Safari/537.36', '', undefined])
  ok(isBot(ua), `bot riconosciuto: ${ua}`);
for (const ua of [CHROME, IPHONE, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'])
  ok(!isBot(ua), `browser non è un bot: ${ua.slice(0, 50)}…`);

// --- matrice ---
// [descrizione, percorso, header, atteso (Location o null), opzioni]
const B = { 'user-agent': CHROME };
const matrix = [
  ['root, Accept-Language he-IL', '/', { ...B, 'accept-language': 'he-IL,he;q=0.9,en;q=0.8' }, '/he/'],
  ['root, Accept-Language iw', '/', { ...B, 'accept-language': 'iw' }, '/he/'],
  ['root, Accept-Language fr-FR', '/', { ...B, 'accept-language': 'fr-FR,fr;q=0.9' }, '/fr/'],
  ['root, Accept-Language it-IT (iPhone)', '/', { 'user-agent': IPHONE, 'accept-language': 'it-IT,it;q=0.9' }, '/it/'],
  ['root, Accept-Language en-US → resta', '/', { ...B, 'accept-language': 'en-US,en;q=0.9' }, null],
  ['en-US vince anche dal paese IL', '/', { ...B, 'accept-language': 'en-US', 'x-vercel-ip-country': 'IL' }, null],
  ['cookie it vince su Accept-Language he', '/', { ...B, 'accept-language': 'he-IL', cookie: 'x=1; eb_lang=it' }, '/it/'],
  ['cookie en vince su Accept-Language fr → resta', '/pricing/', { ...B, 'accept-language': 'fr-FR', cookie: 'eb_lang=en' }, null],
  ['cookie he vince sul paese IT', '/', { ...B, cookie: 'eb_lang=he', 'x-vercel-ip-country': 'IT' }, '/he/'],
  ['cookie non valido → Accept-Language', '/', { ...B, cookie: 'eb_lang=de', 'accept-language': 'fr' }, '/fr/'],
  ['paese IL (lingua non gestita)', '/', { ...B, 'accept-language': 'ru-RU,ru', 'x-vercel-ip-country': 'IL' }, '/he/'],
  ['paese IT', '/', { ...B, 'accept-language': 'de-DE', 'x-vercel-ip-country': 'IT' }, '/it/'],
  ['paese SM', '/', { ...B, 'x-vercel-ip-country': 'SM' }, '/it/'],
  ['paese VA', '/', { ...B, 'x-vercel-ip-country': 'VA' }, '/it/'],
  ['paese FR', '/', { ...B, 'x-vercel-ip-country': 'FR' }, '/fr/'],
  ['paese BE', '/', { ...B, 'accept-language': 'nl-BE', 'x-vercel-ip-country': 'BE' }, '/fr/'],
  ['paese LU', '/', { ...B, 'x-vercel-ip-country': 'LU' }, '/fr/'],
  ['paese MC', '/', { ...B, 'x-vercel-ip-country': 'MC' }, '/fr/'],
  ['paese CH', '/', { ...B, 'x-vercel-ip-country': 'CH' }, '/fr/'],
  ['paese US → resta', '/', { ...B, 'accept-language': 'es', 'x-vercel-ip-country': 'US' }, null],
  ['nessun segnale → resta', '/', { ...B }, null],
  ['?geo=IT (non produzione)', '/?geo=IT', { ...B }, '/it/', { geo: true }],
  ['?geo=IT ignorato in produzione', '/?geo=IT', { ...B }, null, { geo: false }],
  ['?geo vince sull\'header paese (non produzione)', '/?geo=IL', { ...B, 'x-vercel-ip-country': 'US' }, '/he/', { geo: true }],
  ['pagina profonda /pricing/', '/pricing/', { ...B, 'accept-language': 'he' }, '/he/pricing/'],
  ['pagina profonda senza slash /pricing', '/pricing', { ...B, 'accept-language': 'it' }, '/it/pricing/'],
  ['città /cities/jerusalem/', '/cities/jerusalem/', { ...B, 'accept-language': 'fr' }, '/fr/cities/jerusalem/'],
  ['strumento /tools/yield-calculator/', '/tools/yield-calculator/', { ...B, cookie: 'eb_lang=he' }, '/he/tools/yield-calculator/'],
  ['query preservata (utm)', '/pricing/?utm_source=x', { ...B, 'accept-language': 'it' }, '/it/pricing/?utm_source=x'],
  ['?lang=… esplicito → mai', '/?lang=en', { ...B, 'accept-language': 'he' }, null],
  ['percorso esplicito /he/ con cookie it → mai', '/he/', { ...B, cookie: 'eb_lang=it' }, null],
  ['percorso esplicito /fr/pricing/ con Accept-Language he → mai', '/fr/pricing/', { ...B, 'accept-language': 'he' }, null],
  ['percorso esplicito /it/ con paese IL → mai', '/it/', { ...B, 'x-vercel-ip-country': 'IL' }, null],
  ['navigazione interna (Referer stesso sito) → mai', '/', { ...B, 'accept-language': 'he', referer: 'http://SELF/he/' }, null],
  ['Referer esterno (Google) → sì', '/', { ...B, 'accept-language': 'he', referer: 'https://www.google.com/' }, '/he/'],
  ['Googlebot → mai', '/', { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'accept-language': 'he', 'x-vercel-ip-country': 'IL' }, null],
  ['bingbot → mai', '/pricing/', { 'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', 'x-vercel-ip-country': 'FR' }, null],
  ['Lighthouse → mai', '/', { 'user-agent': 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/119.0 Mobile Safari/537.36 Chrome-Lighthouse', 'accept-language': 'it' }, null],
  ['facebookexternalhit → mai', '/', { 'user-agent': 'facebookexternalhit/1.1', 'accept-language': 'fr' }, null],
  ['UA vuoto → mai', '/', { 'accept-language': 'he' }, null],
  ['API → mai', '/api/rates/', { ...B, 'accept-language': 'he' }, null],
  ['file statico → mai', '/robots.txt', { ...B, 'accept-language': 'he' }, null],
  ['sitemap → mai', '/sitemap.xml', { ...B, 'accept-language': 'he' }, null],
  ['pagina inesistente → mai', '/nope/', { ...B, 'accept-language': 'he' }, null],
  ['prefetch del browser → mai', '/', { ...B, 'accept-language': 'he', 'sec-purpose': 'prefetch' }, null],
  ['POST → mai', '/', { ...B, 'accept-language': 'he' }, null, { method: 'POST' }],
];

// --- 1) logica pura ---
const staticDir = process.env.GEO_STATIC ?? (existsSync('.vercel/output/static/index.html') ? '.vercel/output/static' : (process.env.DIST ?? 'dist') + '/client');
const map = buildGeoMap(staticDir);
console.log(`Mappa da ${staticDir}: ${Object.keys(map).length} pagine d'ingresso`);
ok(Object.keys(map).length > 20, 'mappa con le pagine inglesi');
ok(!Object.keys(map).some((p) => /^\/(he|fr|it|en)\//.test(p)), 'mappa senza pagine già con prefisso');
const run = (path, headers, opts = {}) => {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).replace('SELF', 'localhost')]));
  return decide({ method: opts.method ?? 'GET', url: 'http://localhost' + path, header: (n) => h[n.toLowerCase()], map, allowGeoParam: opts.geo ?? true });
};
for (const [desc, path, headers, want, opts] of matrix) {
  const d = run(path, headers, opts);
  ok(d.location === want, `[logica] ${desc}: atteso ${want}, ottenuto ${d.location} (${d.reason})`);
}
// Niente loop: ogni destinazione, richiesta con gli stessi segnali, non reindirizza più ed esiste.
let checked = 0;
for (const [p, entry] of Object.entries(map)) {
  for (const l of ['he', 'fr', 'it']) {
    const d = run(p, { ...B, cookie: `eb_lang=${l}`, 'accept-language': l, 'x-vercel-ip-country': 'IL' });
    if (!entry[l]) { ok(d.location === null, `[loop] ${p} senza traduzione ${l}: nessun redirect`); continue; }
    ok(d.location === entry[l] && d.location.startsWith(`/${l}/`), `[mappa] ${p} → ${entry[l]} (${l})`);
    const again = run(d.location, { ...B, cookie: `eb_lang=${l}`, 'accept-language': l, 'x-vercel-ip-country': 'IL' });
    ok(again.location === null, `[loop] ${d.location} non deve reindirizzare (ottenuto ${again.location})`);
    ok(existsSync(resolve(staticDir, '.' + d.location, 'index.html')), `[404] ${d.location} esiste`);
    checked++;
  }
}
console.log(`Loop/mappa: ${checked} destinazioni verificate`);

// --- 2) Edge Middleware Vercel ---
const fnFile = '.vercel/output/functions/_geo.func/index.js';
if (existsSync(fnFile)) {
  const { default: mw } = await import(pathToFileURL(resolve(fnFile)).href + '?t=' + Date.now());
  const cfg = JSON.parse(readFileSync('.vercel/output/config.json', 'utf8'));
  const vc = JSON.parse(readFileSync('.vercel/output/functions/_geo.func/.vc-config.json', 'utf8'));
  ok(vc.runtime === 'edge', '[edge] runtime edge');
  const iMw = cfg.routes.findIndex((r) => r.middlewarePath === '_geo');
  const iSlash = cfg.routes.findIndex((r) => r.status === 308);
  const iFs = cfg.routes.findIndex((r) => r.handle === 'filesystem');
  const iEn = cfg.routes.findIndex((r) => r.src === '^/en/(.+?)/?$');
  ok(iMw >= 0 && iMw < iSlash && iMw < iFs && iMw > iEn, `[edge] rotta middleware dopo i 301 e prima di slash/filesystem (${iEn} < ${iMw} < ${iSlash})`);
  const re = new RegExp(cfg.routes[iMw]?.src ?? '^$');
  for (const p of ['/', '/pricing/', '/pricing', '/cities/jerusalem/']) ok(re.test(p), `[edge] la rotta copre ${p}`);
  for (const p of ['/he/', '/fr/pricing/', '/it', '/en/', '/api/lead/', '/_astro/x.js', '/robots.txt', '/favicon.svg']) ok(!re.test(p), `[edge] la rotta esclude ${p}`);
  for (const [desc, path, headers, want, opts = {}] of matrix) {
    if (opts.geo === false) continue; // la build locale non è "production"
    if (!re.test(path.split('?')[0])) continue; // non arriva mai al middleware: coperto dal routing
    const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, String(v).replace('SELF', 'www.easybayit.example')]));
    const res = await mw(new Request('https://www.easybayit.example' + path, { method: opts.method ?? 'GET', headers: h }));
    const loc = res.headers.get('location');
    ok(loc === want, `[edge] ${desc}: atteso ${want}, ottenuto ${loc}`);
    if (want) {
      ok(res.status === 302, `[edge] ${desc}: 302`);
      ok(res.headers.get('vary') === 'Accept-Language, Cookie', `[edge] ${desc}: Vary`);
      ok(/no-store/.test(res.headers.get('cache-control') ?? ''), `[edge] ${desc}: non in cache`);
    } else ok(res.headers.get('x-middleware-next') === '1', `[edge] ${desc}: prosegue (x-middleware-next)`);
  }
} else console.log('(edge) .vercel/output assente: eseguire `npm run check:vercel` per testare anche la Edge Middleware');

// --- 3) HTTP su anteprima locale ---
let base = process.env.BASE_URL;
let child;
const DIST = process.env.DIST ?? 'dist';
if (!base && existsSync(DIST + '/server/entry.mjs')) {
  // Porta libera scelta dal sistema (GEO_PORT per fissarla).
  child = spawn(process.execPath, ['scripts/preview-geo.mjs'], { env: { ...process.env, PORT: process.env.GEO_PORT ?? '0', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('preview-geo non partito')), 15000);
    child.stdout.on('data', (b) => { const m = String(b).match(/\[preview-geo\] http:\/\/localhost:(\d+)/); if (m) { base = `http://127.0.0.1:${m[1]}`; clearTimeout(t); res(); } });
    child.on('exit', (c) => rej(new Error('preview-geo uscito: ' + c)));
  });
}
if (base) {
  const host = new URL(base).host;
  for (const [desc, path, headers, want, opts = {}] of matrix) {
    if (opts.geo === false) continue;
    const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, String(v).replace('SELF', host)]));
    const r = await fetch(base + path, { method: opts.method ?? 'GET', headers: h, redirect: 'manual' });
    const loc = r.status === 302 ? r.headers.get('location') : null;
    ok(loc === want, `[http] ${desc}: atteso ${want}, ottenuto ${r.status} ${loc}`);
    if (want) {
      ok(r.headers.get('vary') === 'Accept-Language, Cookie', `[http] ${desc}: Vary`);
      const f = await fetch(base + want, { headers: h, redirect: 'manual' });
      ok(f.status === 200, `[http] ${desc}: destinazione ${want} → 200 senza altri redirect (ottenuto ${f.status})`);
    }
  }
  // Senza header: nessuno UA → nessun redirect; la home risponde 200.
  const r0 = await fetch(base + '/', { headers: { 'user-agent': CHROME }, redirect: 'manual' });
  ok(r0.status === 200, `[http] / senza segnali → 200 (ottenuto ${r0.status})`);
  const html = await r0.text();
  ok(!html.includes('class="lang"'), '[html] nessun selettore lingua nell\'header');
  ok(/<link rel="alternate" hreflang="he" href="[^"]+\/he\/"/.test(html) && /hreflang="x-default"/.test(html), '[html] hreflang + x-default presenti');
  ok((html.match(/data-eb-lang=/g) ?? []).length === 4, '[html] 4 link lingua nel footer');
  const sm = await (await fetch(base + '/sitemap.xml')).text();
  ok(sm.includes('hreflang') || sm.includes('<loc>'), '[sitemap] sitemap.xml raggiungibile');
  child?.kill();
} else console.log('(http) dist/server assente e BASE_URL non impostato: salto il test HTTP');

console.log(fail ? `\n${fail} errori, ${pass} ok` : `\nTutto ok (${pass} verifiche)`);
process.exit(fail ? 1 : 0);
