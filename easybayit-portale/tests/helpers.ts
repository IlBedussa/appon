// Helper test: client Supabase autenticati come utenti di prova del seed (con 2FA se presente).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { totp } from '../scripts/lib/totp.mjs';

export const URL_ = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const creds: { key: string; email: string; password: string; role: string; totpSecret: string | null }[] =
  JSON.parse(readFileSync(new URL('../.local-credentials.json', import.meta.url), 'utf8'));
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const anon = () => createClient(URL_, ANON, opts);
export const service = () => createClient(URL_, SERVICE, opts);

/** Login; se mfa=true e l'utente ha la 2FA, porta la sessione ad aal2. */
export async function as(key: string, mfa = true): Promise<SupabaseClient> {
  const c = creds.find((x) => x.key === key)!;
  const sb = anon();
  const { error } = await sb.auth.signInWithPassword({ email: c.email, password: c.password });
  if (error) throw error;
  if (mfa && c.totpSecret) {
    const { data } = await sb.auth.mfa.listFactors();
    const { error: e } = await sb.auth.mfa.challengeAndVerify({ factorId: data!.totp[0].id, code: totp(c.totpSecret) });
    if (e) throw e;
  }
  return sb;
}
export const cred = (key: string) => creds.find((x) => x.key === key)!;
