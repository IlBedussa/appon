// Tipi condivisi dallo strumento di stima affitto (server API + fallback lato client).

export type Condition = 'renovated' | 'good' | 'needs-work';

export interface RentQuery {
  city: string;            // chiave città (es. 'jerusalem') o 'other'
  neighborhood?: string;   // testo libero (non usato nel calcolo: solo per il lead e per i comparabili)
  street?: string;         // testo libero o via dall'elenco ufficiale
  sqm?: number;            // superficie in m²
  rooms: number;           // numero di stanze all'israeliana (soggiorno incluso), es. 3, 3.5, 4
  floor?: number;          // piano (0 = terra)
  floorsTotal?: number;
  elevator?: boolean;
  parking?: boolean;
  mamad?: boolean;         // stanza protetta (ממ"ד)
  balcony?: boolean;
  condition?: Condition;
}

export interface Adjustment {
  id: string;              // es. 'mamad', 'size', 'floor'
  pct: number;             // variazione applicata, in % (es. 4 = +4%)
  kind: 'data' | 'assumption';
}

export interface Comparable {
  id: string;
  title: string;           // es. "3.5 rooms · Rehavia" (in demo: "Example listing")
  rooms: number;
  sqm: number;
  floor: number;
  rent: number;            // ₪ al mese
  distanceKm?: number;
  url?: string;            // link all'annuncio originale (solo con fornitore autorizzato)
  isExample: boolean;      // true = annuncio di ESEMPIO generato in modalità demo (non reale)
  source: string;          // es. 'demo' | 'yad2'
}

export interface RentEstimate {
  query: RentQuery;
  currency: 'ILS';
  low: number;
  mid: number;
  high: number;
  confidence: 'low' | 'medium' | 'high';
  base: { value: number; level: 'city' | 'district' | 'national'; key: string; sourceId: string };
  roomFactor: { group: string; factor: number; sourceId: string };
  adjustments: Adjustment[];
  totalAdjustmentPct: number;
  rangePct: number;
  comparables: Comparable[];
  comparablesMode: 'demo' | 'live' | 'none';
  comparablesUsedInEstimate: boolean;
  sources: string[];
  generatedAt: string;
}
