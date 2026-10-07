// Livello "fonti dati" collegabile (pluggable) dello strumento di stima affitto.
//
//  (a) Dati ufficiali
//      - CbsStaticProvider: medie CBS per città e per numero di stanze (file src/data/market.ts, con fonte e data).
//        [DA AGGIORNARE ogni trimestre: CBS pubblica la tabella 4.9 "Average monthly prices of rent
//         by district, big cities and size groups" nel bollettino mensile dei prezzi.]
//      - NadlanProvider (STUB): nadlan.gov.il pubblica le COMPRAVENDITE (non gli affitti) e, alla data
//        del 02/10/2026, non risulta un'API pubblica documentata. [DA VERIFICARE con il Ministero / data.gov.il]
//  (b) Comparabili (annunci in affitto vicini)
//      - DemoComparablesProvider: genera annunci di ESEMPIO, etichettati come tali, mai usati nel calcolo.
//      - Yad2ComparablesProvider (STUB): NON implementato di proposito.
//
// Selezione del fornitore di comparabili: variabile d'ambiente RENT_COMPARABLES_PROVIDER = 'demo' (default) | 'yad2' | 'none'.
import type { Comparable, RentQuery } from './types';

export interface ComparablesProvider {
  readonly id: string;
  /** true = restituisce annunci reali utilizzabili nel calcolo. */
  readonly live: boolean;
  find(q: RentQuery, around: number): Promise<Comparable[]>;
}

export class NotConfiguredError extends Error {}

/**
 * Yad2 — STUB.
 * [DA VERIFICARE: serve accordo/API ufficiale con Yad2]
 * NON fare scraping di Yad2: con ogni probabilità viola i termini d'uso del sito, che è inoltre protetto
 * da sistemi anti-bot. Questo adattatore va implementato SOLO con un'API o un feed concesso per iscritto
 * (credenziali in variabili d'ambiente, mai nel codice), rispettando i limiti di uso e la privacy.
 */
export class Yad2ComparablesProvider implements ComparablesProvider {
  readonly id = 'yad2';
  readonly live = true;
  async find(): Promise<Comparable[]> {
    throw new NotConfiguredError('Yad2 adapter not configured: an official agreement/API with Yad2 is required.');
  }
}

/** Generatore pseudo-casuale deterministico (stessa richiesta → stessi annunci di esempio). */
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Annunci di ESEMPIO (finti) per la modalità demo. Etichettati "isExample: true". */
export class DemoComparablesProvider implements ComparablesProvider {
  readonly id = 'demo';
  readonly live = false;
  async find(q: RentQuery, around: number): Promise<Comparable[]> {
    const rnd = seeded(JSON.stringify([q.city, q.rooms, q.sqm, q.street]));
    const n = 5;
    const out: Comparable[] = [];
    for (let i = 0; i < n; i++) {
      const rooms = Math.max(1, q.rooms + [-0.5, 0, 0, 0.5, 0][i]);
      const sqm = Math.round((q.sqm ?? rooms * 25) * (0.85 + rnd() * 0.3));
      const rent = Math.round((around * (0.86 + rnd() * 0.28)) / 50) * 50;
      out.push({
        id: `EX-${i + 1}`,
        title: `Example listing ${i + 1}`,
        rooms,
        sqm,
        floor: Math.floor(rnd() * 8),
        rent,
        distanceKm: Math.round((0.2 + rnd() * 1.6) * 10) / 10,
        isExample: true,
        source: 'demo',
      });
    }
    return out;
  }
}

export function getComparablesProvider(): ComparablesProvider | null {
  const id = (typeof process !== 'undefined' ? process.env.RENT_COMPARABLES_PROVIDER : undefined) ?? 'demo';
  if (id === 'none') return null;
  if (id === 'yad2') return new Yad2ComparablesProvider();
  return new DemoComparablesProvider();
}

/**
 * Nadlan (gov.il) — STUB. [DA VERIFICARE: esiste un'API pubblica ufficiale? Riguarda solo compravendite.]
 * Potrebbe servire in futuro per il rendimento lordo (prezzo di acquisto stimato), non per gli affitti.
 */
export const NadlanProvider = {
  id: 'nadlan',
  available: false,
  note: 'nadlan.gov.il publishes sale transactions; no documented public rent API found (checked 2026-10-02).',
};
