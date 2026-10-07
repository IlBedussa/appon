// Anteprima locale con la selezione automatica della lingua (equivalente della Edge Middleware Vercel).
// Serve la build Node (`npm run build` → dist/) con lo stesso handler di `astro preview` (static + /api),
// applicando prima src/lib/geo-lang.mjs. Paese simulabile con l'header x-vercel-ip-country o con ?geo=IT.
// Uso: npm run build && npm run preview:geo     (PORT=4321 HOST=0.0.0.0 DIST=dist di default)
import http from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { decide, VARY } from '../src/lib/geo-lang.mjs';
import { buildGeoMap } from './geo-map.mjs';

const dist = resolve(process.env.DIST ?? 'dist');
const port = Number(process.env.PORT ?? 4321);
const host = process.env.HOST ?? '0.0.0.0';
// ?geo=XX è uno strumento di test: mai attivo se si forza GEO_PRODUCTION=1.
const allowGeoParam = process.env.GEO_PRODUCTION !== '1';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import(pathToFileURL(resolve(dist, 'server/entry.mjs')).href);
const map = buildGeoMap(resolve(dist, 'client'));

const server = http.createServer((req, res) => {
  const d = decide({
    method: req.method,
    url: `http://${req.headers.host ?? 'localhost'}${req.url}`,
    header: (n) => { const v = req.headers[n.toLowerCase()]; return Array.isArray(v) ? v.join(', ') : v; },
    map,
    allowGeoParam,
  });
  if (d.location) {
    res.writeHead(302, { Location: d.location, Vary: VARY, 'Cache-Control': 'private, no-store', 'X-Eb-Lang-Reason': d.reason });
    return res.end();
  }
  if (d.reason !== 'not-an-entry-page') res.setHeader('Vary', VARY);
  handler(req, res);
});
server.listen(port, host, () => {
  console.log(`[preview-geo] http://localhost:${server.address().port}/ — ${Object.keys(map).length} pagine d'ingresso, dist=${dist}, ?geo ${allowGeoParam ? 'attivo' : 'disattivato'}`);
});
