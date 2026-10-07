// DATI DI ESEMPIO per la dashboard demo proprietari.
// TUTTO È FITTIZIO: immobili, inquilini, importi, date e tassi di cambio servono solo a illustrare l'interfaccia.
// Non rappresentano clienti, prezzi o risultati reali di Easybayit.

export type PropId = 'A' | 'B' | 'C' | 'D';

/** Tassi di cambio FISSI e ILLUSTRATIVI (non aggiornati, non reali). */
export const demoRates = { ILS: 1, USD: 0.27, EUR: 0.25 } as const;
export type Currency = keyof typeof demoRates;

/** 12 mesi della demo (ottobre 2025 → settembre 2026). */
export const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
export const income = [21900, 21900, 21900, 15100, 15100, 21900, 21900, 21900, 21900, 21900, 21900, 21900];
export const expenses = [3900, 4300, 3600, 5200, 6100, 3700, 4100, 3800, 4600, 3587, 4197, 5300];

export const properties: {
  id: PropId; status: 'occupied' | 'vacant' | 'maintenance'; rent: number; leaseStart?: string; leaseEnd?: string;
  deposit?: number; rooms: number; spark: number[];
}[] = [
  { id: 'A', status: 'occupied', rent: 7200, leaseStart: '2025-02-01', leaseEnd: '2027-01-31', deposit: 14400, rooms: 3, spark: [5, 6, 6, 7, 6, 7, 7, 8] },
  { id: 'B', status: 'occupied', rent: 6800, leaseStart: '2024-12-15', leaseEnd: '2026-12-14', deposit: 13600, rooms: 2, spark: [6, 6, 5, 6, 7, 6, 7, 7] },
  { id: 'C', status: 'vacant', rent: 6500, rooms: 2, spark: [6, 6, 6, 0, 0, 4, 3, 2] },
  { id: 'D', status: 'maintenance', rent: 7900, leaseStart: '2025-07-01', leaseEnd: '2027-06-30', deposit: 15800, rooms: 4, spark: [7, 7, 8, 7, 8, 8, 7, 8] },
];

export type ItemKey = 'rent' | 'fee' | 'repair' | 'vaad' | 'insurance' | 'listing' | 'cleaning';
export const statements: Record<string, { date: string; key: ItemKey; prop?: PropId; amount: number }[]> = {
  '2026-09': [
    { date: '2026-09-01', key: 'rent', prop: 'A', amount: 7200 },
    { date: '2026-09-01', key: 'rent', prop: 'B', amount: 6800 },
    { date: '2026-09-02', key: 'rent', prop: 'D', amount: 7900 },
    { date: '2026-09-05', key: 'fee', amount: -2190 },
    { date: '2026-09-12', key: 'repair', prop: 'D', amount: -1263 },
    { date: '2026-09-15', key: 'vaad', prop: 'A', amount: -380 },
    { date: '2026-09-15', key: 'vaad', prop: 'B', amount: -320 },
    { date: '2026-09-20', key: 'listing', prop: 'C', amount: -450 },
    { date: '2026-09-28', key: 'insurance', amount: -697 },
  ],
  '2026-08': [
    { date: '2026-08-01', key: 'rent', prop: 'A', amount: 7200 },
    { date: '2026-08-01', key: 'rent', prop: 'B', amount: 6800 },
    { date: '2026-08-03', key: 'rent', prop: 'D', amount: 7900 },
    { date: '2026-08-05', key: 'fee', amount: -2190 },
    { date: '2026-08-15', key: 'vaad', prop: 'A', amount: -380 },
    { date: '2026-08-15', key: 'vaad', prop: 'B', amount: -320 },
    { date: '2026-08-22', key: 'cleaning', prop: 'C', amount: -610 },
    { date: '2026-08-28', key: 'insurance', amount: -697 },
  ],
  '2026-07': [
    { date: '2026-07-01', key: 'rent', prop: 'A', amount: 7200 },
    { date: '2026-07-01', key: 'rent', prop: 'B', amount: 6800 },
    { date: '2026-07-02', key: 'rent', prop: 'D', amount: 7900 },
    { date: '2026-07-05', key: 'fee', amount: -2190 },
    { date: '2026-07-15', key: 'vaad', prop: 'A', amount: -380 },
    { date: '2026-07-15', key: 'vaad', prop: 'B', amount: -320 },
    { date: '2026-07-28', key: 'insurance', amount: -697 },
  ],
};

export type ReqKey = 'heater' | 'ac' | 'tap';
export const requests: { id: string; prop: PropId; key: ReqKey; priority: 'urgent' | 'normal'; opened: string; step: number }[] = [
  { id: 'R-1042', prop: 'D', key: 'heater', priority: 'urgent', opened: '2026-09-24', step: 3 },
  { id: 'R-1039', prop: 'B', key: 'ac', priority: 'normal', opened: '2026-09-18', step: 4 },
  { id: 'R-1031', prop: 'A', key: 'tap', priority: 'normal', opened: '2026-09-03', step: 5 },
];
export const quote = { request: 'R-1042', items: [450, 620, 193], total: 1263 };

export type DocType = 'lease' | 'insurance' | 'invoice' | 'statement';
export const documents: { type: DocType; n: number; prop?: PropId; date: string; kb: number }[] = [
  { type: 'lease', n: 1, prop: 'A', date: '2025-01-20', kb: 412 },
  { type: 'lease', n: 1, prop: 'B', date: '2024-12-01', kb: 398 },
  { type: 'lease', n: 1, prop: 'D', date: '2025-06-15', kb: 455 },
  { type: 'insurance', n: 1, date: '2026-01-01', kb: 220 },
  { type: 'insurance', n: 2, prop: 'D', date: '2026-03-10', kb: 186 },
  { type: 'invoice', n: 1042, prop: 'D', date: '2026-09-12', kb: 96 },
  { type: 'invoice', n: 1031, prop: 'A', date: '2026-09-06', kb: 88 },
  { type: 'invoice', n: 990, prop: 'C', date: '2026-08-22', kb: 91 },
  { type: 'statement', n: 9, date: '2026-09-30', kb: 140 },
  { type: 'statement', n: 8, date: '2026-08-31', kb: 138 },
  { type: 'statement', n: 7, date: '2026-07-31', kb: 135 },
];

export const payments: { date: string; prop: PropId; amount: number; method: 'transfer' | 'standing'; status: 'paid' | 'late' | 'pending' }[] = [
  { date: '2026-10-01', prop: 'A', amount: 7200, method: 'standing', status: 'pending' },
  { date: '2026-10-01', prop: 'B', amount: 6800, method: 'transfer', status: 'pending' },
  { date: '2026-09-02', prop: 'D', amount: 7900, method: 'transfer', status: 'paid' },
  { date: '2026-09-01', prop: 'B', amount: 6800, method: 'transfer', status: 'paid' },
  { date: '2026-09-01', prop: 'A', amount: 7200, method: 'standing', status: 'paid' },
  { date: '2026-08-06', prop: 'D', amount: 7900, method: 'transfer', status: 'late' },
  { date: '2026-08-01', prop: 'B', amount: 6800, method: 'transfer', status: 'paid' },
  { date: '2026-08-01', prop: 'A', amount: 7200, method: 'standing', status: 'paid' },
  { date: '2026-07-02', prop: 'D', amount: 7900, method: 'transfer', status: 'paid' },
  { date: '2026-07-01', prop: 'B', amount: 6800, method: 'transfer', status: 'paid' },
  { date: '2026-07-01', prop: 'A', amount: 7200, method: 'standing', status: 'paid' },
];

/** Prossimo bonifico (demo). */
export const nextPayout = { date: '2026-10-10', amount: 16600 };
