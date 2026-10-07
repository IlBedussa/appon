// Calcoli sui tempi di risposta/risoluzione (SLA) a partire dalla vista public.maintenance_sla.
export const median = (xs: number[]): number | null => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/** Ore -> testo breve ("5 h" o "2,5 g") nella lingua corrente. */
export function duration(hours: number | null, tpl: { hours: string; days: string }, intl: string): string {
  if (hours == null) return '—';
  const nf = (n: number, d: number) => new Intl.NumberFormat(intl, { maximumFractionDigits: d }).format(n);
  return hours < 48 ? tpl.hours.replace('{n}', nf(hours, hours < 10 ? 1 : 0)) : tpl.days.replace('{n}', nf(hours / 24, 1));
}
