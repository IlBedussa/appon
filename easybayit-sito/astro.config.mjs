// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import rehypeBlog from './src/lib/rehype-blog.mjs';

// Configurazione Astro per Easybayit.
// Quasi tutto il sito è STATICO (pagine prerenderizzate in dist/client).
// Solo le rotte /api/* (stima affitto, tassi BOI, autocompletamento vie) girano lato server:
// - in locale / su un server Node: adattatore @astrojs/node (modalità standalone);
// - su Vercel: impostare DEPLOY_TARGET=vercel → adattatore @astrojs/vercel (funzioni serverless).
// Su Vercel la variabile VERCEL=1 è impostata automaticamente durante la build.
const target = process.env.DEPLOY_TARGET === 'vercel' || process.env.VERCEL ? 'vercel' : 'node';

export default defineConfig({
  // Dominio del sito: serve per canonical, hreflang, sitemap e robots.txt.
  // Si imposta con la variabile SITE_URL (su Vercel: Settings → Environment Variables, disponibile anche in build).
  // [DA CONFERMARE] dominio definitivo; finché manca resta il segnaposto .example.
  site: process.env.SITE_URL || 'https://www.easybayit.example',
  output: 'static',
  adapter: target === 'vercel' ? vercel() : node({ mode: 'standalone' }),
  trailingSlash: 'always',
  // Reindirizzamenti permanenti (generati anche nella configurazione Vercel dall'adattatore).
  // L'inglese non ha prefisso: /en/... → /...
  redirects: {
    '/en': '/',
    '/en/[...path]': '/[...path]',
    '/contact-us': '/contact/',
    '/insights': '/blog/',
    '/legal': '/legal-tax/',
  },
  build: {
    format: 'directory',
    // CSS inline nell'HTML: elimina le richieste che bloccano il rendering (FCP/LCP più rapidi su mobile).
    inlineStylesheets: 'always',
  },
  // i18n nativo di Astro: inglese predefinito su "/", ebraico (RTL) su /he/,
  // italiano su /it/, francese su /fr/.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'he', 'it', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Articoli del blog: evidenzia i [DA VERIFICARE] e gestisce i link esterni.
  markdown: { rehypePlugins: [rehypeBlog] },
  // Nessuna telemetria/script di terze parti nel sito generato.
  devToolbar: { enabled: false },
});
