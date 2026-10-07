// Dati per il calcolatore di cambio gestore.
// I livelli e le percentuali vengono da src/data/pricing.ts (listino di ESEMPIO, [DA CONFERMARE]).
// Il costo di ricerca inquilino replica i testi dei livelli (x.offer.tiers.*.search): Essential 1 mese,
// Full ½ mese, Care non applicabile — [DA CONFERMARE] insieme al listino.
// Ricarico sui lavori Easybayit: 0% (impegno "no mark-up") — [DA CONFERMARE].
export const LETTING_MONTHS: Record<'essential' | 'full' | 'care', number | null> = { essential: 1, full: 0.5, care: null };
export const EASYBAYIT_MARKUP_PCT = 0;
/** Valori iniziali di esempio del modulo (l'utente li sostituisce con i propri). */
export const SWITCH_DEFAULTS = { rent: 6000, feePct: 8, fixed: 0, works: 3000, markup: 0, letting: 1, turnover: 2, other: 0, vatIncl: false };
