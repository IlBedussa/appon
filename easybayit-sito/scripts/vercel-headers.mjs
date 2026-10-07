// Post-build per Vercel (eseguito da `npm run build` dopo `astro build`).
// Con DEPLOY_TARGET=vercel (o VERCEL=1, impostato da Vercel) l'adattatore genera .vercel/output (Build Output API).
// In quel caso la configurazione di routing è .vercel/output/config.json: questo script vi copia
//  1) le intestazioni ("headers") definite in vercel.json (sicurezza, cache, noindex delle API);
//  2) i reindirizzamenti ("redirects") di vercel.json, PRIMA della regola che aggiunge lo slash finale.
//     Motivo: le regole generate da Astro (es. ^/contact-us$) non intercettano /contact-us/ e, dopo il 308
//     che aggiunge lo slash, l'utente finirebbe su un 404. Le regole Astro di tipo 301 vengono sostituite.
// Se .vercel/output non esiste (build Node locale) non fa nulla. È idempotente.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const out = '.vercel/output/config.json';
const isVercel = process.env.DEPLOY_TARGET === 'vercel' || !!process.env.VERCEL;
if (!existsSync(out) || !isVercel) process.exit(0);
const cfg = JSON.parse(readFileSync(out, 'utf8'));
const vj = JSON.parse(readFileSync('vercel.json', 'utf8'));
const esc = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

// 1) Intestazioni: "source" in stile path-to-regexp semplice → regex.
const toSrc = (s) => '^' + s.replace(/\(\.\*\)/g, '(.*)') + '$';
const headerRoutes = (vj.headers ?? []).map((h) => ({
  src: toSrc(h.source),
  headers: Object.fromEntries(h.headers.map((x) => [x.key, x.value])),
  continue: true,
}));

// 2) Reindirizzamenti: supporta "/percorso" e "/percorso/:path*" (almeno un segmento; il caso vuoto
//    va dichiarato a parte, es. "/en"). Lo slash finale è facoltativo nella richiesta.
const redirectRoutes = (vj.redirects ?? []).map((r) => {
  const wild = r.source.endsWith('/:path*');
  const base = wild ? r.source.slice(0, -'/:path*'.length) : r.source;
  const src = '^' + esc(base) + (wild ? '/(.+?)' : '') + '/?$';
  const loc = r.destination.endsWith('/:path*') ? r.destination.slice(0, -'/:path*'.length) + '/$1/' : r.destination;
  return { src, headers: { Location: loc }, status: r.permanent === false ? 302 : 301 };
});

const ours = new Set([...headerRoutes, ...redirectRoutes].map((r) => JSON.stringify(r)));
const rest = (cfg.routes ?? []).filter((r) => !ours.has(JSON.stringify(r)) && !(r.status === 301 && r.headers?.Location));
cfg.routes = [...headerRoutes, ...redirectRoutes, ...rest];
writeFileSync(out, JSON.stringify(cfg, null, 2));
console.log(`[vercel-headers] ${headerRoutes.length} regole di intestazioni e ${redirectRoutes.length} reindirizzamenti scritti in ${out}`);
