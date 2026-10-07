// Simulazione semplificata del routing Vercel su .vercel/output/config.json (dopo DEPLOY_TARGET=vercel npm run build).
// Verifica che reindirizzamenti, slash finale e pagine statiche rispondano come previsto. Uso: node scripts/check-vercel-routes.mjs
import { readFileSync, existsSync } from 'node:fs';
const cfg = JSON.parse(readFileSync('.vercel/output/config.json', 'utf8'));
const staticDir = '.vercel/output/static';
function resolve(path, hops = 0) {
  if (hops > 5) return { code: 'LOOP', path };
  let headers = {};
  for (const r of cfg.routes) {
    if (r.handle === 'filesystem') {
      const f = staticDir + path + (path.endsWith('/') ? 'index.html' : '');
      if (existsSync(f)) return { code: 200, path, headers, hops };
      continue;
    }
    if (!r.src) continue;
    const m = path.match(new RegExp(r.src));
    if (!m) continue;
    if (r.headers && r.continue) { Object.assign(headers, r.headers); continue; }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.Location.replace(/\$(\d)/g, (_, i) => m[i] ?? '');
      return { ...resolve(loc, hops + 1), via: `${path} →${r.status} ${loc}` + (resolve(loc, hops + 1).via ? ' ' + resolve(loc, hops + 1).via : '') };
    }
    if (r.dest) return { code: r.status ?? 'fn', path, headers, hops };
  }
  return { code: 404, path };
}
const cases = [
  ['/', 200], ['/pricing/', 200], ['/pricing', 200], ['/he/', 200], ['/he', 200], ['/fr/legal-tax/', 200],
  ['/en', 200], ['/en/', 200], ['/en/pricing', 200], ['/en/pricing/', 200], ['/en/cities/jerusalem/', 200],
  ['/contact-us', 200], ['/contact-us/', 200], ['/insights/', 200], ['/legal', 200],
  ['/robots.txt', 200], ['/sitemap.xml', 200], ['/api/lead/', 'fn'], ['/nope/', 404],
];
let fail = 0;
for (const [p, want] of cases) {
  const r = resolve(p);
  const ok = r.code === want;
  if (!ok) fail++;
  console.log(ok ? '✓' : '✗', p.padEnd(26), '→', r.code, r.path, r.via ? `(${r.via})` : '', r.hops > 1 ? `[${r.hops} salti]` : '');
}
const h = resolve('/').headers;
for (const k of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Frame-Options']) if (!h[k]) { fail++; console.log('✗ manca intestazione', k); }
// Selezione automatica della lingua: Edge Middleware generata da scripts/vercel-geo.mjs (test completi: npm run test:geo).
if (!cfg.routes.some((r) => r.middlewarePath === '_geo') || !existsSync('.vercel/output/functions/_geo.func/index.js')) { fail++; console.log('✗ manca la Edge Middleware _geo (lingua automatica)'); }
console.log(fail ? `${fail} errori` : 'Tutto ok');
process.exit(fail ? 1 : 0);
