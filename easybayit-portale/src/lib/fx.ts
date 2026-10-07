// Tassi di cambio ufficiali Banca d'Israele (tasso rappresentativo), con cache:
// 1) memoria del processo (10 minuti)  2) tabella public.fx_rates (aggiornata se più vecchia di 6 ore).
// Se la BOI non risponde si usa l'ultimo tasso salvato. Solo visualizzazione: la contabilità resta in ILS.
import { adminClient } from './supabase';
import { BOI_API_URL } from 'astro:env/server';

export interface FxRates { USD: number; EUR: number; GBP: number; date: string; stale: boolean }

let memo: { at: number; value: FxRates | null } | null = null;
const MEMO_MS = 10 * 60 * 1000;
const REFRESH_MS = 6 * 60 * 60 * 1000;

/** Analizza il CSV SDMX della BOI (colonne SERIES_CODE ... TIME_PERIOD, OBS_VALUE). */
export type FxCur = 'USD' | 'EUR' | 'GBP';
export function parseBoiCsv(csv: string): { currency: FxCur; date: string; rate: number }[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0].split(',');
  const iSeries = head.indexOf('SERIES_CODE'), iDate = head.indexOf('TIME_PERIOD'), iVal = head.indexOf('OBS_VALUE');
  if (iSeries < 0 || iDate < 0 || iVal < 0) return [];
  const out: { currency: FxCur; date: string; rate: number }[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    const m = /^RER_(USD|EUR|GBP)_ILS$/.exec(c[iSeries] ?? '');
    const rate = Number(c[iVal]);
    if (m && /^\d{4}-\d{2}-\d{2}$/.test(c[iDate] ?? '') && rate > 0 && rate < 100) {
      out.push({ currency: m[1] as FxCur, date: c[iDate], rate });
    }
  }
  return out;
}

async function fetchBoi(): Promise<ReturnType<typeof parseBoiCsv>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${BOI_API_URL}?lastNObservations=1&format=csv`, { signal: ctrl.signal, headers: { accept: 'text/csv' } });
    if (!res.ok) return [];
    return parseBoiCsv(await res.text());
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function readLatest(): Promise<{ rates: FxRates | null; fetchedAt: number }> {
  const { data } = await adminClient().from('fx_rates').select('currency, rate_date, ils_per_unit, fetched_at').order('rate_date', { ascending: false }).limit(15);
  const usd = data?.find((r) => r.currency === 'USD');
  const eur = data?.find((r) => r.currency === 'EUR');
  const gbp = data?.find((r) => r.currency === 'GBP');
  if (!usd || !eur || !gbp) return { rates: null, fetchedAt: 0 };
  const fetchedAt = Math.min(Date.parse(usd.fetched_at), Date.parse(eur.fetched_at), Date.parse(gbp.fetched_at));
  return {
    rates: { USD: Number(usd.ils_per_unit), EUR: Number(eur.ils_per_unit), GBP: Number(gbp.ils_per_unit), date: [usd.rate_date, eur.rate_date, gbp.rate_date].sort().at(-1)!, stale: false },
    fetchedAt,
  };
}

export async function getFxRates(): Promise<FxRates | null> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  let { rates, fetchedAt } = await readLatest();
  if (!rates || Date.now() - fetchedAt > REFRESH_MS) {
    const fresh = await fetchBoi();
    if (fresh.length) {
      await adminClient().from('fx_rates').upsert(
        fresh.map((r) => ({ currency: r.currency, rate_date: r.date, ils_per_unit: r.rate, fetched_at: new Date().toISOString() })),
      );
      ({ rates } = await readLatest());
    } else if (rates) {
      rates = { ...rates, stale: true };
    }
  }
  memo = { at: Date.now(), value: rates };
  return rates;
}
