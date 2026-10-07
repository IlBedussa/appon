// Tassi di ripiego (₪ per 1 unità di valuta estera) se la API BOI non risponde.
// Valori = tassi rappresentativi Bank of Israel letti il 02/10/2026. Mostrati SEMPRE con la loro data.
export const FALLBACK_RATES = {
  source: 'fallback' as const,
  date: '2026-10-02',
  ilsPer: { USD: 3.06, EUR: 3.4419, GBP: 4.0407 },
};
