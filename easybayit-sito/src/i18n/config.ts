// Configurazione centrale di lingue e pagine.
// Inglese = lingua predefinita su "/"; ebraico su /he/, italiano su /it/, francese su /fr/.
// Tutte le pagine esistono in tutte le lingue con lo stesso slug,
// così il selettore lingua e gli hreflang restano sempre coerenti.
import { getRelativeLocaleUrl } from 'astro:i18n';
import en from './en';
import he from './he';
import it from './it';
import fr from './fr';
import dash from './dash';
import x from './extra';
import legal from './legal';
import blog from './blog';
import trust, { trustPages, isTrustKey, type TrustPageKey } from './trust';

export const locales = ['en', 'he', 'fr', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** Città con pagina dedicata (slug stabile in tutte le lingue). */
export const cityKeys = ['jerusalem', 'beit-shemesh', 'raanana', 'netanya', 'tel-aviv'] as const;
export type CityKey = (typeof cityKeys)[number];

export const pages = [
  { key: 'home', slug: '' },
  { key: 'owners', slug: 'owners' },
  { key: 'tenants', slug: 'tenants' },
  { key: 'how', slug: 'how-it-works' },
  { key: 'pricing', slug: 'pricing' },
  { key: 'care', slug: 'care' },
  { key: 'b2b', slug: 'developers' },
  { key: 'portal', slug: 'portal' },
  { key: 'demo', slug: 'portal/demo' },
  { key: 'technology', slug: 'technology' },
  { key: 'rent', slug: 'rent-estimate' },
  { key: 'yield', slug: 'tools/yield-calculator' },
  { key: 'guide', slug: 'guide/owning-from-abroad' },
  { key: 'legal', slug: 'legal-tax' },
  { key: 'blog', slug: 'blog' },
  { key: 'cities', slug: 'cities' },
  { key: 'city-jerusalem', slug: 'cities/jerusalem' },
  { key: 'city-beit-shemesh', slug: 'cities/beit-shemesh' },
  { key: 'city-raanana', slug: 'cities/raanana' },
  { key: 'city-netanya', slug: 'cities/netanya' },
  { key: 'city-tel-aviv', slug: 'cities/tel-aviv' },
  { key: 'about', slug: 'about' },
  { key: 'faq', slug: 'faq' },
  { key: 'contact', slug: 'contact' },
  { key: 'privacy', slug: 'privacy' },
  { key: 'terms', slug: 'terms' },
  { key: 'accessibility', slug: 'accessibility' },
  // Trust batch (pledge, report, ispezioni, videochiamata, cambio gestore; metriche e sicurezza solo con flag)
  ...trustPages,
] as const;
export type PageKey = (typeof pages)[number]['key'] | TrustPageKey;

export const dictionaries = { he, en, it, fr };
export const t = (lang: Locale) => dictionaries[lang];
/** Testi della dashboard demo proprietari. */
export const td = (lang: Locale) => dash[lang];
/** Testi delle sezioni/pagine aggiunte nella fase 3 (posizionamento, strumenti, città…). */
export const tx = (lang: Locale) => x[lang];
/** Testi dell'hub Legale & Fiscale. */
export const tl = (lang: Locale) => legal[lang];
/** Testi dell'interfaccia del blog. */
export const tb = (lang: Locale) => blog[lang];
/** Testi del trust batch (pledge, drive di esempio, report, ispezioni, videochiamata, cambio gestore). */
export const tt = (lang: Locale) => trust[lang];

/** Titolo e description SEO di una pagina (dizionario principale o testi "extra"). */
export function pageMeta(lang: Locale, key: PageKey): { title: string; description: string } {
  if (key === 'legal') return legal[lang].meta;
  if (key === 'blog') return blog[lang].meta;
  if (isTrustKey(key)) return trust[lang].meta[key];
  const e = tx(lang).meta as Record<string, { title: string; description: string } | undefined>;
  if (e[key]) return e[key]!;
  const m = (t(lang).pages as Record<string, { title: string; description: string } | undefined>)[key];
  return m ?? { title: 'Easybayit', description: '' };
}

/** Etichetta di navigazione di una pagina. */
export function navLabel(lang: Locale, key: PageKey): string {
  if (key === 'legal') return legal[lang].nav;
  if (key === 'blog') return blog[lang].nav;
  if (isTrustKey(key)) return trust[lang].nav[key];
  const e = tx(lang).nav as unknown as Record<string, unknown>;
  if (typeof e[key] === 'string') return e[key] as string;
  return (t(lang).nav as Record<string, string | undefined>)[key] ?? key;
}

export const langMeta: Record<Locale, { dir: 'rtl' | 'ltr'; label: string; short: string; og: string; intl: string }> = {
  en: { dir: 'ltr', label: 'English', short: 'EN', og: 'en_US', intl: 'en-US' },
  he: { dir: 'rtl', label: 'עברית', short: 'עב', og: 'he_IL', intl: 'he-IL' },
  fr: { dir: 'ltr', label: 'Français', short: 'FR', og: 'fr_FR', intl: 'fr-FR' },
  it: { dir: 'ltr', label: 'Italiano', short: 'IT', og: 'it_IT', intl: 'it-IT' },
};

/** URL relativo di una pagina in una lingua (usa l'helper i18n nativo di Astro). */
export function url(lang: Locale, key: PageKey, hash = ''): string {
  const slug = pages.find((p) => p.key === key)?.slug ?? '';
  let u = getRelativeLocaleUrl(lang, slug);
  if (!u.endsWith('/')) u += '/';
  return u + hash;
}
