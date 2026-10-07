// Mappa delle pagine d'ingresso per la selezione automatica della lingua (vedi src/lib/geo-lang.mjs).
// Legge l'HTML generato: per ogni pagina inglese senza prefisso prende gli hreflang (stessa fonte di <head> e sitemap);
// se una pagina non ha hreflang (es. noindex) usa /<lingua>/<percorso>/ solo se il file esiste.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OTHER = ['he', 'fr', 'it'];

/** @param {string} staticDir cartella con l'HTML statico (dist/client o .vercel/output/static) */
export function buildGeoMap(staticDir) {
  /** @type {Record<string, Partial<Record<string, string>>>} */
  const map = {};
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      if (!statSync(abs).isDirectory()) continue;
      if (rel === '/' && (OTHER.includes(name) || name === 'en' || name.startsWith('_') || name === 'api')) continue;
      walk(abs, rel + name + '/');
    }
    const file = join(dir, 'index.html');
    if (!existsSync(file)) return;
    const html = readFileSync(file, 'utf8');
    const entry = {};
    for (const m of html.matchAll(/<link\b[^>]*rel="alternate"[^>]*>/g)) {
      const hl = m[0].match(/hreflang="([^"]+)"/)?.[1];
      const href = m[0].match(/href="([^"]+)"/)?.[1];
      if (!hl || !href || !OTHER.includes(hl)) continue;
      try { entry[hl] = new URL(href, 'https://x.invalid').pathname; } catch { /* ignora */ }
    }
    for (const l of OTHER) {
      if (!entry[l] && existsSync(join(staticDir, l, rel, 'index.html'))) entry[l] = `/${l}${rel}`;
    }
    // Tiene solo destinazioni che esistono davvero (niente redirect verso un 404).
    for (const l of Object.keys(entry)) {
      if (!existsSync(join(staticDir, entry[l], 'index.html'))) delete entry[l];
    }
    if (Object.keys(entry).length) map[rel] = entry;
  };
  walk(staticDir, '/');
  return map;
}
