// Post-build per Vercel: genera la Edge Middleware della selezione automatica della lingua.
// Il sito è statico (output: 'static'): il middleware di Astro gira solo in build/SSR e non vedrebbe le pagine
// prerenderizzate. Per questo creiamo direttamente una funzione Edge con la Build Output API:
//   .vercel/output/functions/_geo.func (runtime edge) + una rotta { src, middlewarePath: "_geo", continue: true }
// inserita dopo intestazioni e reindirizzamenti permanenti e PRIMA della regola dello slash finale
// (così /pricing → /it/pricing/ in un solo salto). Logica in src/lib/geo-lang.mjs, mappa dagli hreflang.
// ?geo=XX (simulazione paese) è accettato solo se la build NON è di produzione (VERCEL_ENV !== 'production').
// Idempotente; non fa nulla senza .vercel/output (build Node locale).
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { build } from 'esbuild';
import { buildGeoMap } from './geo-map.mjs';

const root = '.vercel/output';
const isVercel = process.env.DEPLOY_TARGET === 'vercel' || !!process.env.VERCEL;
if (!existsSync(root + '/config.json') || !isVercel) process.exit(0);

const map = buildGeoMap(root + '/static');
const allowGeoParam = process.env.VERCEL_ENV !== 'production';
const fn = root + '/functions/_geo.func';
rmSync(fn, { recursive: true, force: true });
mkdirSync(fn, { recursive: true });

await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
import { decide, VARY } from './src/lib/geo-lang.mjs';
const MAP = ${JSON.stringify(map)};
const ALLOW_GEO_PARAM = ${JSON.stringify(allowGeoParam)};
export default function middleware(request) {
  const d = decide({ method: request.method, url: request.url, header: (n) => request.headers.get(n), map: MAP, allowGeoParam: ALLOW_GEO_PARAM });
  if (d.location) {
    return new Response(null, { status: 302, headers: {
      Location: d.location, Vary: VARY, 'Cache-Control': 'private, no-store', 'X-Eb-Lang-Reason': d.reason,
    } });
  }
  const h = { 'x-middleware-next': '1' };
  if (d.reason !== 'not-an-entry-page') h.Vary = VARY;
  return new Response(null, { headers: h });
}`,
  },
  bundle: true, format: 'esm', target: 'esnext', platform: 'browser', minify: true,
  outfile: fn + '/index.js', logLevel: 'warning',
});
writeFileSync(fn + '/.vc-config.json', JSON.stringify({ runtime: 'edge', entrypoint: 'index.js' }, null, 2));

const cfg = JSON.parse(readFileSync(root + '/config.json', 'utf8'));
const routes = (cfg.routes ?? []).filter((r) => r.middlewarePath !== '_geo');
// Solo percorsi "pagina" senza prefisso lingua (niente file con estensione, API, asset, /he/ /fr/ /it/ /en/).
const geoRoute = {
  src: '^/(?!(?:he|fr|it|en|api|_astro|_image|_server-islands|_vercel|\\.well-known)(?:/|$))[^.]*$',
  middlewarePath: '_geo',
  override: true,
  continue: true,
};
let at = routes.findIndex((r) => !(r.continue && r.headers && !r.middlewarePath) && !(r.status === 301 && r.headers?.Location));
if (at < 0) at = routes.length;
routes.splice(at, 0, geoRoute);
cfg.routes = routes;
writeFileSync(root + '/config.json', JSON.stringify(cfg, null, 2));
console.log(`[vercel-geo] Edge Middleware _geo: ${Object.keys(map).length} pagine d'ingresso, ?geo ${allowGeoParam ? 'attivo (non produzione)' : 'disattivato (produzione)'}`);
