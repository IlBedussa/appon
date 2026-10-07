// robots.txt generato in build: il dominio della sitemap segue SITE_URL (vedi astro.config.mjs).
// Le API non vanno indicizzate; le bozze del blog hanno già noindex e non sono in sitemap.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://www.easybayit.example'); // [DA CONFERMARE] dominio definitivo
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${new URL('/sitemap.xml', base).href}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
