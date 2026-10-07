// Client Supabase lato server.
// - createUserClient: usa la chiave anon + la sessione dell'utente nei cookie -> ogni query passa da RLS.
// - adminClient: usa la service key, bypassa RLS. Usarlo SOLO per operazioni di sistema
//   (inviti, coda email, rate limit, cache cambi). Mai esporlo al browser.
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, COOKIE_SECURE } from 'astro:env/server';

export const authCookieOptions = () => ({
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true, // la sessione non è leggibile da JavaScript nel browser
  secure: COOKIE_SECURE,
});

export function createUserClient(request: Request, cookies: AstroCookies): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' }));
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          try {
            cookies.set(name, value, { ...options, ...authCookieOptions(), maxAge: options?.maxAge });
          } catch {
            // risposta già inviata: il refresh verrà ripetuto alla richiesta successiva
          }
        }
      },
    },
  });
}

let _admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

/** Client "usa e getta" per verificare una password senza toccare i cookie della sessione corrente. */
export function ephemeralClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
