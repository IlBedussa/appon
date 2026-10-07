// Sitemap generata in fase di build, con alternative hreflang per ogni pagina (nessuna dipendenza esterna).
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { locales, pages, url, defaultLocale } from '../i18n/config';
import { postUrl, alternatesOf } from '../lib/blog';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://www.easybayit.example');
  const abs = (p: string) => new URL(p, base).href;
  const entries = pages.flatMap((p) =>
    locales.map((l) => {
      const alts = locales
        .map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${abs(url(a, p.key))}"/>`)
        .join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(url(defaultLocale, p.key))}"/>`;
      return `<url><loc>${abs(url(l, p.key))}</loc>${alts}</url>`;
    })
  );
  // Articoli del blog: solo quelli pubblicati (le bozze NON vanno mai in sitemap, nemmeno con SHOW_DRAFTS=1).
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  for (const p of posts) {
    const alt = alternatesOf(p, posts);
    const links = Object.entries(alt).map(([a, h]) => `<xhtml:link rel="alternate" hreflang="${a}" href="${abs(h!)}"/>`).join('')
      + `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(alt[defaultLocale] ?? postUrl(p))}"/>`;
    entries.push(`<url><loc>${abs(postUrl(p))}</loc>${links}</url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
