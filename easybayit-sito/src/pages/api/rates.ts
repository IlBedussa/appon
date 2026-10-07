// API server-side: tassi di cambio rappresentativi della Banca d'Israele (BOI).
// La API pubblica BOI non invia intestazioni CORS, quindi il browser non può chiamarla direttamente:
// questa rotta fa da proxy con cache in memoria (1 ora) e ripiego su tassi fissi DATATI.
import type { APIRoute } from 'astro';
import { FALLBACK_RATES } from '../../data/rates';

export const prerender = false;

let cache: { at: number; body: unknown } | null = null;

export const GET: APIRoute = async () => {
  if (cache && Date.now() - cache.at < 3600_000) return respond(cache.body);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('https://boi.org.il/PublicApi/GetExchangeRates', { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error(String(r.status));
    const data = (await r.json()) as { exchangeRates: { key: string; currentExchangeRate: number; unit: number; lastUpdate: string }[] };
    const pick = (k: string) => {
      const x = data.exchangeRates.find((e) => e.key === k);
      return x ? x.currentExchangeRate / (x.unit || 1) : undefined;
    };
    const USD = pick('USD'), EUR = pick('EUR'), GBP = pick('GBP');
    if (!USD || !EUR || !GBP) throw new Error('missing');
    const body = { source: 'boi', date: data.exchangeRates[0]?.lastUpdate ?? new Date().toISOString(), ilsPer: { USD, EUR, GBP } };
    cache = { at: Date.now(), body };
    return respond(body);
  } catch {
    return respond(FALLBACK_RATES);
  }
};

const respond = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=900' } });
