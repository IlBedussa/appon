// Logica di stima TRASPARENTE dell'affitto mensile.
// È deliberatamente semplice e spiegabile: ogni passaggio viene restituito al client e mostrato all'utente.
//
//  1) BASE (dato ufficiale): affitto medio CBS della città (1° trim. 2026).
//     Se la città non è pubblicata → media del distretto; altrimenti → media nazionale.
//  2) FATTORE STANZE (dato ufficiale): rapporto tra la media nazionale CBS per classe di stanze
//     e la media nazionale complessiva dello STESSO trimestre (1° trim. 2025).
//  3) AGGIUSTAMENTI (ASSUNZIONI di Easybayit, NON dati ufficiali): superficie, piano/ascensore,
//     mamad, parcheggio, balcone, stato. Sono parametri in ASSUMPTIONS, da validare. [DA CONFERMARE]
//  4) FORCHETTA: ±RANGE_PCT attorno al valore centrale (più larga se la base non è la città).
//  5) COMPARABILI: in modalità demo sono annunci di ESEMPIO e NON entrano nel calcolo.
//     Con un fornitore autorizzato (vedi providers.ts) si potrà fondere la mediana dei comparabili.
import { rentQ1_2026, roomsQ1_2025, cityData } from '../../data/market';
import type { Adjustment, Comparable, RentEstimate, RentQuery } from './types';

/**
 * Assunzioni di Easybayit (NON statistiche ufficiali). [DA CONFERMARE con un perito / dati reali]
 * Valori volutamente prudenti; vengono mostrati all'utente come "assunzione".
 */
export const ASSUMPTIONS = {
  /** Superficie "tipica" per classe di stanze (m²), usata solo per l'aggiustamento superficie. */
  typicalSqm: { '1-2': 45, '2.5-3': 70, '3.5-4': 95, '4.5-6': 125 } as Record<string, number>,
  /** Elasticità affitto/superficie: +10% di m² → +4% di affitto. */
  sizeElasticity: 0.4,
  sizeCapPct: 12,
  mamadPct: 4,
  parkingPct: 3,
  balconyPct: 2,
  /** Piano alto (≥3) senza ascensore. */
  walkUpPct: -4,
  /** Piano alto (≥6) con ascensore. */
  highFloorPct: 2,
  condition: { renovated: 5, good: 0, 'needs-work': -8 } as Record<string, number>,
  totalCapPct: 20,
  /** Semi-ampiezza della forchetta. */
  rangeCityPct: 12,
  rangeFallbackPct: 18,
  roundTo: 50,
};

const round = (v: number, step = ASSUMPTIONS.roundTo) => Math.round(v / step) * step;

export function roomGroup(rooms: number) {
  const g = roomsQ1_2025.groups.find((x) => rooms <= x.max) ?? roomsQ1_2025.groups[roomsQ1_2025.groups.length - 1];
  return g;
}

export function estimateRent(q: RentQuery, comparables: Comparable[] = [], comparablesMode: RentEstimate['comparablesMode'] = 'none'): RentEstimate {
  // 1) Base ufficiale
  const city = cityData[q.city];
  const direct = rentQ1_2026.cities[q.city];
  let base: RentEstimate['base'];
  if (direct) base = { value: direct, level: 'city', key: q.city, sourceId: 'cbsRentQ1_2026' };
  else if (city && rentQ1_2026.districts[city.district]) base = { value: rentQ1_2026.districts[city.district], level: 'district', key: city.district, sourceId: 'cbsRentQ1_2026' };
  else base = { value: rentQ1_2026.national, level: 'national', key: 'israel', sourceId: 'cbsRentQ1_2026' };

  // 2) Fattore stanze (stesso trimestre al numeratore e al denominatore)
  const rooms = Math.min(Math.max(q.rooms || 3, 1), 6);
  const g = roomGroup(rooms);
  const factor = g.avg / roomsQ1_2025.national;

  // 3) Aggiustamenti (assunzioni)
  const A = ASSUMPTIONS;
  const adj: Adjustment[] = [];
  if (q.sqm && q.sqm > 10) {
    const typical = A.typicalSqm[g.id];
    const diff = (q.sqm - typical) / typical;
    const pct = Math.max(-A.sizeCapPct, Math.min(A.sizeCapPct, diff * 100 * A.sizeElasticity));
    if (Math.abs(pct) >= 0.5) adj.push({ id: 'size', pct: Math.round(pct * 10) / 10, kind: 'assumption' });
  }
  if (q.mamad) adj.push({ id: 'mamad', pct: A.mamadPct, kind: 'assumption' });
  if (q.parking) adj.push({ id: 'parking', pct: A.parkingPct, kind: 'assumption' });
  if (q.balcony) adj.push({ id: 'balcony', pct: A.balconyPct, kind: 'assumption' });
  if (typeof q.floor === 'number') {
    if (q.floor >= 3 && !q.elevator) adj.push({ id: 'walkup', pct: A.walkUpPct, kind: 'assumption' });
    else if (q.floor >= 6 && q.elevator) adj.push({ id: 'highfloor', pct: A.highFloorPct, kind: 'assumption' });
  }
  if (q.condition && A.condition[q.condition]) adj.push({ id: `condition-${q.condition}`, pct: A.condition[q.condition], kind: 'assumption' });

  const rawTotal = adj.reduce((s, a) => s + a.pct, 0);
  const total = Math.max(-A.totalCapPct, Math.min(A.totalCapPct, rawTotal));

  const mid0 = base.value * factor * (1 + total / 100);
  const rangePct = base.level === 'city' ? A.rangeCityPct : A.rangeFallbackPct;

  // 5) I comparabili entrano nel calcolo SOLO se reali (non di esempio) e almeno 5.
  const real = comparables.filter((c) => !c.isExample);
  let mid = mid0;
  let used = false;
  if (real.length >= 5) {
    const sorted = real.map((c) => c.rent).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    mid = 0.5 * mid0 + 0.5 * median; // fusione 50/50 dichiarata
    used = true;
  }

  const confidence: RentEstimate['confidence'] = used ? (real.length >= 10 ? 'high' : 'medium') : base.level === 'city' ? 'medium' : 'low';

  return {
    query: q,
    currency: 'ILS',
    low: round(mid * (1 - rangePct / 100)),
    mid: round(mid),
    high: round(mid * (1 + rangePct / 100)),
    // Senza comparabili reali la fiducia massima è "media": le medie CBS nascondono grandi differenze tra quartieri.
    confidence,
    base,
    roomFactor: { group: g.id, factor: Math.round(factor * 1000) / 1000, sourceId: 'cbsRoomsQ1_2025' },
    adjustments: adj,
    totalAdjustmentPct: Math.round(total * 10) / 10,
    rangePct,
    comparables,
    comparablesMode,
    comparablesUsedInEstimate: used,
    sources: ['cbsRentQ1_2026', 'cbsRoomsQ1_2025'],
    generatedAt: new Date().toISOString(),
  };
}

/** Validazione/normalizzazione dell'input (usata dall'API e dal client). */
export function parseQuery(input: Record<string, unknown>): RentQuery | null {
  const num = (v: unknown) => (v === '' || v == null ? undefined : Number(v));
  const bool = (v: unknown) => v === true || v === 'true' || v === '1' || v === 'on';
  const rooms = num(input.rooms);
  const city = String(input.city ?? '').slice(0, 40);
  if (!city || !rooms || !Number.isFinite(rooms) || rooms < 1 || rooms > 12) return null;
  const sqm = num(input.sqm);
  const floor = num(input.floor);
  const cond = String(input.condition ?? '');
  return {
    city,
    neighborhood: String(input.neighborhood ?? '').slice(0, 80) || undefined,
    street: String(input.street ?? '').slice(0, 80) || undefined,
    rooms,
    sqm: sqm && Number.isFinite(sqm) && sqm > 0 && sqm < 2000 ? sqm : undefined,
    floor: floor !== undefined && Number.isFinite(floor) && floor >= -2 && floor < 100 ? floor : undefined,
    elevator: bool(input.elevator),
    parking: bool(input.parking),
    mamad: bool(input.mamad),
    balcony: bool(input.balcony),
    condition: (['renovated', 'good', 'needs-work'] as const).find((c) => c === cond),
  };
}
