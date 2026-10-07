// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import { loadEnv } from 'vite';

// Portale Easybayit (portal.<dominio>): app SSR separata dal sito marketing.
// In locale gira con l'adapter Node; su Vercel si imposta DEPLOY_TARGET=vercel
// (funzioni nella regione UE "fra1", la stessa di Supabase Francoforte).
const isVercel = process.env.DEPLOY_TARGET === 'vercel' || process.env.VERCEL === '1';

// Upload diretti: il browser carica foto, video e documenti su Supabase Storage con URL firmati,
// quindi la CSP (generata alla build) deve consentire connect-src verso l'origine di Supabase.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
let supabaseOrigin = '';
try { supabaseOrigin = env.SUPABASE_URL ? new URL(env.SUPABASE_URL).origin : ''; } catch { supabaseOrigin = ''; }
if (isVercel && !supabaseOrigin) throw new Error('SUPABASE_URL mancante alla build: serve per la CSP (connect-src) degli upload diretti');

export default defineConfig({
  output: 'server',
  adapter: isVercel
    ? vercel({
        // i font del PDF vengono letti da disco a runtime
        includeFiles: [
          './node_modules/@fontsource/heebo/files/heebo-latin-400-normal.woff',
          './node_modules/@fontsource/heebo/files/heebo-latin-700-normal.woff',
          './node_modules/@fontsource/heebo/files/heebo-hebrew-400-normal.woff',
          './node_modules/@fontsource/heebo/files/heebo-hebrew-700-normal.woff',
        ],
      })
    : node({ mode: 'standalone' }),
  server: { port: 4322, host: '127.0.0.1' },
  devToolbar: { enabled: false },
  // Variabili d'ambiente validate all'avvio. I segreti restano solo lato server.
  env: {
    schema: {
      SITE_URL: envField.string({ context: 'server', access: 'public', default: 'http://localhost:4322' }),
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_ANON_KEY: envField.string({ context: 'server', access: 'secret' }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret' }),
      COOKIE_SECURE: envField.boolean({ context: 'server', access: 'secret', default: true }),
      EMAIL_PROVIDER: envField.enum({ context: 'server', access: 'secret', values: ['smtp', 'resend', 'console'], default: 'console' }),
      EMAIL_FROM: envField.string({ context: 'server', access: 'secret', default: 'Easybayit <no-reply@easybayit.example>' }),
      SMTP_HOST: envField.string({ context: 'server', access: 'secret', default: '127.0.0.1' }),
      SMTP_PORT: envField.number({ context: 'server', access: 'secret', default: 54325 }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CRON_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      PDF_INTEGRITY_SECRET: envField.string({ context: 'server', access: 'secret' }),
      BOI_API_URL: envField.string({ context: 'server', access: 'secret', default: 'https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/RER_USD_ILS,RER_EUR_ILS,RER_GBP_ILS' }),
      LOGIN_MAX_ATTEMPTS: envField.number({ context: 'server', access: 'secret', default: 5 }),
      // Metriche di servizio aggregate pubbliche (/api/public/sla) lette dal sito alla build: spente di default
      PUBLIC_METRICS_ENABLED: envField.boolean({ context: 'server', access: 'secret', default: false }),
      // Bot di manutenzione WhatsApp / web chat (WIP)
      WHATSAPP_PROVIDER: envField.enum({ context: 'server', access: 'secret', values: ['cloud', 'simulator', 'disabled'], default: 'simulator' }),
      WHATSAPP_ACCESS_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      WHATSAPP_PHONE_NUMBER_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      WHATSAPP_APP_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      WHATSAPP_VERIFY_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      WHATSAPP_GRAPH_VERSION: envField.string({ context: 'server', access: 'secret', optional: true }),
      WHATSAPP_SIMULATOR: envField.boolean({ context: 'server', access: 'secret', default: false }),
      BOT_EMERGENCY_PHONE: envField.string({ context: 'server', access: 'secret', optional: true }),
      NLU_PROVIDER: envField.enum({ context: 'server', access: 'secret', values: ['rules', 'llm'], default: 'rules' }),
    },
  },
  security: {
    // Protezione CSRF di base di Astro (controllo Origin) + token sincronizzatore nel middleware
    checkOrigin: true,
    // CSP con hash automatici di script e stili (attiva nella build di produzione)
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "font-src 'self'",
        `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ''}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  vite: {
    ssr: { external: ['pdfkit', 'nodemailer'] },
  },
});
