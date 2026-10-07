// Utilità del blog: lettura della collection con filtro bozze, URL, tempo di lettura, traduzioni.
import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from '../config/flags';
import { defaultLocale, type Locale } from '../i18n/config';

export type Post = CollectionEntry<'blog'>;

/** Articoli visibili in questa build: le bozze solo con SHOW_DRAFTS=1 (o in dev). Ordinati per data, poi titolo. */
export async function getPosts(lang?: Locale): Promise<Post[]> {
  const all = await getCollection('blog', ({ data }) => (SHOW_DRAFTS || !data.draft) && (!lang || data.lang === lang));
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.data.title.localeCompare(b.data.title));
}

/** URL dell'articolo: /blog/<slug>/ (EN) e /<lang>/blog/<slug>/ (HE/FR/IT). */
export const postUrl = (p: Post) => '/' + [p.data.lang === defaultLocale ? '' : p.data.lang, 'blog', p.data.slug].filter(Boolean).join('/') + '/';

/** Minuti di lettura stimati (≈220 parole/min; l'ebraico conta parole più corte, ≈180). */
export function readingMinutes(p: Post): number {
  const words = (p.body ?? '').replace(/[#*_>`\[\]()|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / (p.data.lang === 'he' ? 180 : 220)));
}

/** Traduzioni esistenti (stesso translationKey) tra gli articoli visibili. */
export function alternatesOf(p: Post, all: Post[]): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  for (const q of all) if (q.data.translationKey === p.data.translationKey) out[q.data.lang] = postUrl(q);
  return out;
}

/** Articoli correlati: stesso cluster o segmenti in comune, poi i più recenti (max n). */
export function related(p: Post, sameLang: Post[], n = 3): Post[] {
  const score = (q: Post) =>
    (q.data.cluster === p.data.cluster ? 3 : 0) + q.data.segment.filter((s) => p.data.segment.includes(s)).length;
  return sameLang.filter((q) => q.id !== p.id).map((q) => ({ q, s: score(q) })).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.q);
}

/** Data localizzata (es. 2 Oct 2026). */
export const fmtDate = (d: Date, intl: string) => d.toLocaleDateString(intl, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
