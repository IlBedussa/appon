// Registrazione eventi sensibili. Le modifiche ai dati sono già tracciate dai trigger nel DB;
// qui si registrano eventi "di lettura" o di autenticazione (login, download, 2FA).
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient } from './supabase';

export async function logEvent(sb: SupabaseClient, action: string, entity?: string, entityId?: string, meta: Record<string, unknown> = {}) {
  const { error } = await sb.rpc('log_event', { p_action: action, p_entity: entity ?? null, p_entity_id: entityId ?? null, p_meta: meta });
  if (error) console.error('[audit]', action, error.message);
}

/** Eventi senza utente autenticato (es. login fallito): scritti con la service key. */
export async function logSystemEvent(action: string, meta: Record<string, unknown> = {}) {
  const { error } = await adminClient().from('audit_log').insert({ action, actor_role: 'anonymous', entity: 'auth', meta });
  if (error) console.error('[audit]', action, error.message);
}
