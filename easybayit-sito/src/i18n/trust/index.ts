// Testi del "trust batch" per lingua + elenco delle pagine aggiunte (alcune dietro flag).
import en from './en';
import he from './he';
import fr from './fr';
import it from './it';
import { SHOW_SERVICE_METRICS, SHOW_TRUST_SECURITY } from '../../config/trust-flags';
export type { TrustDict } from './en';
export default { en, he, fr, it };

export type TrustPageKey = 'pledge' | 'report' | 'inspections' | 'call' | 'switching' | 'metrics' | 'security';
const all: { key: TrustPageKey; slug: string; enabled: boolean }[] = [
  { key: 'pledge', slug: 'transparency-pledge', enabled: true },
  { key: 'report', slug: 'monthly-health-report', enabled: true },
  { key: 'inspections', slug: 'photo-inspections', enabled: true },
  { key: 'call', slug: 'book-a-call', enabled: true },
  { key: 'switching', slug: 'switching-manager', enabled: true },
  // Spente di default (vedi src/config/trust-flags.ts)
  { key: 'metrics', slug: 'service-metrics', enabled: SHOW_SERVICE_METRICS },
  { key: 'security', slug: 'trust-security', enabled: SHOW_TRUST_SECURITY },
];
/** Pagine del trust batch effettivamente generate in questa build. */
export const trustPages: { key: TrustPageKey; slug: string }[] = all.filter((p) => p.enabled).map(({ key, slug }) => ({ key, slug }));
export const trustKeys = all.map((p) => p.key);
export const isTrustKey = (k: string): k is TrustPageKey => (trustKeys as string[]).includes(k);
