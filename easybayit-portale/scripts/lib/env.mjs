// Lettura variabili per script e test (stesse chiavi dell'app, da .env).
export const env = {
  url: process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321',
  anon: process.env.SUPABASE_ANON_KEY,
  service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  site: process.env.SITE_URL ?? 'http://localhost:4322',
};
if (!env.anon || !env.service) throw new Error('SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY mancanti: usare node --env-file=.env');
