// Formattazione di importi e date nella lingua dell'utente.
// La contabilità è in ILS: le altre valute sono solo una conversione di visualizzazione.
import type { FxRates } from './fx';

export type Currency = 'ILS' | 'USD' | 'EUR' | 'GBP';

export function convert(ils: number, cur: Currency, fx: FxRates | null): number {
  if (cur === 'ILS' || !fx) return ils;
  const rate = fx[cur];
  return rate ? ils / rate : ils;
}

export function money(ils: number | string | null | undefined, intl: string, cur: Currency = 'ILS', fx: FxRates | null = null, opts: { signed?: boolean; compact?: boolean; decimals?: number } = {}) {
  const n = Number(ils ?? 0);
  const effective: Currency = cur !== 'ILS' && !fx ? 'ILS' : cur;
  const v = convert(n, effective, fx);
  const s = new Intl.NumberFormat(intl, {
    style: 'currency', currency: effective, currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: opts.decimals ?? (opts.compact ? 0 : 0), minimumFractionDigits: 0,
    ...(opts.compact ? { notation: 'compact' as const } : {}),
  }).format(Math.abs(v));
  if (opts.signed) return (v < 0 ? '−' : '+') + '\u2009' + s;
  return (v < 0 ? '−' : '') + s;
}

/** Importo esatto in ILS con 2 decimali (per PDF e back-office). */
export const ils = (n: number | string, intl: string) =>
  new Intl.NumberFormat(intl, { style: 'currency', currency: 'ILS', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));

export function date(iso: string | null | undefined, intl: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  const d = iso.length <= 10 ? new Date((iso.length === 7 ? iso + '-01' : iso) + 'T00:00:00Z') : new Date(iso);
  return new Intl.DateTimeFormat(intl, { ...o, timeZone: iso.length <= 10 ? 'UTC' : 'Asia/Jerusalem' }).format(d);
}

export const dateTime = (iso: string | null | undefined, intl: string) =>
  date(iso, intl, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const monthLong = (ym: string, intl: string) => date(ym.slice(0, 7), intl, { month: 'long', year: 'numeric' });
export const monthShort = (ym: string, intl: string) => date(ym.slice(0, 7), intl, { month: 'short' });

export const bytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** Primo giorno del mese "YYYY-MM-01" partendo da una data. */
export const monthStart = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;

/** Ultimi N mesi (dal più vecchio al più recente), formato YYYY-MM. */
export function lastMonths(n: number, from = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}
