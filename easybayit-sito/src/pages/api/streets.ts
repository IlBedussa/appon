// API server-side: autocompletamento delle vie dall'elenco ufficiale (Rashut HaOchlusin, data.gov.il).
// GET /api/streets/?city=<codice CBS località>&q=<testo>  →  { streets: string[] }
// Nessuna chiave a pagamento. Se il servizio non risponde, il client usa l'inserimento libero.
import type { APIRoute } from 'astro';

export const prerender = false;
const RESOURCE = '9ad3862c-8391-4b2f-84a4-2d4c68625f4b'; // "רשימת רחובות בישראל" (dataset 321)

export const GET: APIRoute = async ({ url }) => {
  const city = Number(url.searchParams.get('city'));
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 40);
  if (!Number.isInteger(city) || city <= 0 || q.length < 2) return out([]);
  try {
    const api = new URL('https://data.gov.il/api/3/action/datastore_search');
    api.searchParams.set('resource_id', RESOURCE);
    api.searchParams.set('filters', JSON.stringify({ 'סמל_ישוב': city }));
    api.searchParams.set('q', q);
    api.searchParams.set('limit', '12');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch(api, { signal: ctrl.signal });
    clearTimeout(timer);
    const data = (await r.json()) as { result?: { records?: { 'שם_רחוב': string }[] } };
    const names = [...new Set((data.result?.records ?? []).map((x) => String(x['שם_רחוב']).trim()))].slice(0, 10);
    return out(names);
  } catch {
    return out([], 'unavailable');
  }
};

const out = (streets: string[], status = 'ok') =>
  new Response(JSON.stringify({ streets, status }), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
