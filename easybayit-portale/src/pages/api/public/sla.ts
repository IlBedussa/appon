// Metriche di servizio AGGREGATE dell'intero portafoglio, per la pagina pubblica del sito (letta alla build).
// Spenta di default (PUBLIC_METRICS_ENABLED=false → 404). Solo mesi con almeno 5 richieste, nessun dato personale.
import type { APIRoute } from 'astro';
import { PUBLIC_METRICS_ENABLED } from 'astro:env/server';
import { adminClient } from '../../../lib/supabase';

export const GET: APIRoute = async () => {
  if (!PUBLIC_METRICS_ENABLED) return new Response('Not found', { status: 404 });
  const { data, error } = await adminClient().rpc('portfolio_sla_stats', { p_months: 12 });
  if (error) return new Response(JSON.stringify({ months: [] }), { status: 502, headers: { 'content-type': 'application/json' } });
  const months = (data ?? []).map((r: any) => ({
    month: String(r.month).slice(0, 10), requests: Number(r.requests),
    median_response_hours: r.median_response_hours == null ? null : Number(r.median_response_hours),
    median_resolution_hours: r.median_resolution_hours == null ? null : Number(r.median_resolution_hours),
    p90_resolution_hours: r.p90_resolution_hours == null ? null : Number(r.p90_resolution_hours),
  }));
  return new Response(JSON.stringify({ months, generated_at: new Date().toISOString(), min_requests_per_month: 5 }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' },
  });
};
