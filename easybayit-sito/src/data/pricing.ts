// LISTINO DI ESEMPIO — [DA CONFERMARE da David: costi reali, margini, IVA].
// I valori sono costruiti sui benchmark di mercato pubblici (vedi docs/ricerca-mercato.md §3):
//  - gestione affitto lungo 7–10% + IVA, minimo tipico ₪225–500 (Flamingo, Dugrinet, Agency TLV, HouseManager);
//  - casa vuota/vacanza a canone fisso ₪500–2.500 + IVA al mese (Agency TLV, Kaufman).
// Sul sito sono SEMPRE marcati "Example pricing [TO CONFIRM]".
export interface Tier {
  id: 'essential' | 'full' | 'care';
  model: 'percent' | 'fixed';
  pct?: number;        // % dell'affitto mensile, IVA esclusa
  minIls?: number;     // minimo mensile, IVA esclusa
  fixedIls?: number;   // canone fisso mensile, IVA esclusa
  tenantSearch?: string; // descrizione breve del costo di ricerca inquilino (chiave i18n)
  featured?: boolean;
}

export const tiers: Tier[] = [
  { id: 'essential', model: 'percent', pct: 8, minIls: 400 },
  { id: 'full', model: 'percent', pct: 10, minIls: 500, featured: true },
  { id: 'care', model: 'fixed', fixedIls: 950 },
];

/** Calcola il costo mensile (IVA esclusa e inclusa) di un livello per un dato affitto. */
export function monthlyFee(t: Tier, rent: number, vat = 0.18) {
  const net = t.model === 'fixed' ? t.fixedIls ?? 0 : Math.max((rent * (t.pct ?? 0)) / 100, t.minIls ?? 0);
  return { net, vat: net * vat, gross: net * (1 + vat) };
}
