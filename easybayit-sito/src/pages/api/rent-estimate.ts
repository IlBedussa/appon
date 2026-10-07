// API server-side: stima dell'affitto (funzione serverless su Vercel / route Node in locale).
// POST JSON { city, rooms, sqm?, floor?, elevator?, parking?, mamad?, balcony?, condition?, neighborhood?, street? }
// Risposta: RentEstimate (vedi src/lib/rent/types.ts) con metodo, fiducia, fonti e comparabili.
import type { APIRoute } from 'astro';
import { estimateRent, parseQuery } from '../../lib/rent/estimate';
import { getComparablesProvider, NotConfiguredError } from '../../lib/rent/providers';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const q = parseQuery(input);
  if (!q) return json({ error: 'invalid_query' }, 422);

  // Prima stima senza comparabili, per centrare gli eventuali annunci di esempio.
  const first = estimateRent(q);
  const provider = getComparablesProvider();
  if (!provider) return json(first);
  try {
    const comps = await provider.find(q, first.mid);
    return json(estimateRent(q, comps, provider.live ? 'live' : 'demo'));
  } catch (e) {
    // Fornitore non configurato (es. Yad2 senza accordo): si risponde con i soli dati ufficiali.
    if (e instanceof NotConfiguredError) return json({ ...first, comparablesMode: 'none', note: 'comparables_provider_not_configured' });
    return json({ ...first, comparablesMode: 'none' });
  }
};

export const GET: APIRoute = () => json({ error: 'use_post' }, 405);
