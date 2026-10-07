// Verifica che ogni pagina generata abbia title <= 60 e description <= 155 caratteri,
// lang/dir corretti e i tag hreflang (4 lingue + x-default = 5).
// Con l'adapter (output ibrido) le pagine statiche sono in dist/client.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); });
import { existsSync } from 'node:fs';
walk(existsSync('dist/client') ? 'dist/client' : 'dist');
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
let bad = 0;
for (const f of files.sort()) {
  const h = readFileSync(f, 'utf8');
  const title = dec(h.match(/<title>(.*?)<\/title>/)?.[1] ?? '');
  const desc = dec(h.match(/<meta name="description" content="(.*?)"/)?.[1] ?? '');
  const lang = h.match(/<html lang="(\w+)" dir="(\w+)"/);
  const hreflang = (h.match(/hreflang="[^"]+" href/g) ?? []).length;
  // Articoli del blog: hreflang solo per le traduzioni esistenti (>= 2 = sé stesso + x-default).
  // Pagine noindex (es. bozze del blog): nessun hreflang atteso.
  const noindex = /<meta name="robots" content="noindex"/.test(h);
  const isPost = /[\\/]blog[\\/][^\\/]+[\\/]index\.html$/.test(f);
  const hrefOk = f.includes('404') || (noindex ? hreflang === 0 : isPost ? hreflang >= 2 : hreflang === 5);
  const ok = [...title].length <= 60 && [...desc].length <= 155 && lang && hrefOk;
  if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'ERR'} ${f.padEnd(52)} t=${[...title].length} d=${[...desc].length} ${lang?.[1]}/${lang?.[2]} hreflang=${hreflang}`);
}
console.log(bad ? `\n${bad} problemi` : '\nTutto ok');
process.exit(bad ? 1 : 0);
