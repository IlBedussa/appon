// Job giornaliero promemoria scadenze (documenti, fine contratti). Protetto da CRON_SECRET.
import type { APIRoute } from 'astro';
import { CRON_SECRET } from 'astro:env/server';
import { tokensMatch } from '../../../lib/csrf';
import { adminClient } from '../../../lib/supabase';
import { processOutbox } from '../../../lib/outbox';

const handler: APIRoute = async ({ request }) => {
  if (!CRON_SECRET || !tokensMatch(request.headers.get('authorization') ?? '', `Bearer ${CRON_SECRET}`)) return new Response('Unauthorized', { status: 401 });
  const { data, error } = await adminClient().rpc('run_expiry_reminders', { p_lease_days: 90 });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  const mail = await processOutbox(50);
  return new Response(JSON.stringify({ reminders: data, ...mail }), { headers: { 'content-type': 'application/json' } });
};
export const GET = handler;
export const POST = handler;
