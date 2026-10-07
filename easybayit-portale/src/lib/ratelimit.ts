// Rate limiting basato su Postgres (funziona anche con più istanze serverless su Vercel).
import { createHash } from 'node:crypto';
import { adminClient } from './supabase';

const key = (scope: string, id: string) => `${scope}:${createHash('sha256').update(id.toLowerCase()).digest('hex').slice(0, 32)}`;

/** true = richiesta consentita. In caso di errore del DB si consente (fail-open) ma si registra in console. */
export async function hit(scope: string, id: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await adminClient().rpc('rate_limit_hit', { p_key: key(scope, id), p_max: max, p_window_seconds: windowSeconds });
  if (error) {
    console.error('[ratelimit]', error.message);
    return true;
  }
  return data === true;
}

export async function reset(scope: string, id: string) {
  await adminClient().rpc('rate_limit_reset', { p_key: key(scope, id) });
}
