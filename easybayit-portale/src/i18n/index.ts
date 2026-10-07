// Configurazione lingue del portale. La lingua è scelta da cookie (eb_lang),
// poi dal profilo utente, poi dall'header Accept-Language. Default: inglese.
import en, { type Dict } from './en';
import he from './he';
import it from './it';
import fr from './fr';

export const locales = ['en', 'he', 'it', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (locales as readonly string[]).includes(v);

const dicts: Record<Locale, Dict> = { en, he, it, fr };
export const dict = (l: Locale): Dict => dicts[l];

export const langMeta: Record<Locale, { dir: 'rtl' | 'ltr'; label: string; short: string; intl: string }> = {
  en: { dir: 'ltr', label: 'English', short: 'EN', intl: 'en-GB' },
  he: { dir: 'rtl', label: 'עברית', short: 'עב', intl: 'he-IL' },
  it: { dir: 'ltr', label: 'Italiano', short: 'IT', intl: 'it-IT' },
  fr: { dir: 'ltr', label: 'Français', short: 'FR', intl: 'fr-FR' },
};

/** Sostituisce i segnaposto {chiave} con i valori. */
export const fill = (s: string, o: Record<string, string | number | null | undefined>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(o[k] ?? ''));

/** Sceglie la lingua dall'header Accept-Language. */
export function fromAcceptLanguage(h: string | null): Locale {
  if (!h) return 'en';
  for (const part of h.split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (code === 'iw') return 'he';
    if (isLocale(code)) return code;
  }
  return 'en';
}
export type { Dict };
