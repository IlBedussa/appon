// Content collection del blog (da easybayit-content/schema/content.config.ts).
// I file stanno in src/content/blog/<lang>/<slug>.md; id = "<lang>/<slug>".
// `draft: true` = escluso dalle build di produzione (vedi SHOW_DRAFTS in src/config/flags.ts).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const faqItem = z.object({
  question: z.string().min(5),
  answer: z.string().min(10),
});

const source = z.object({
  title: z.string(),
  publisher: z.string(),
  url: z.url(),
  accessed: z.coerce.date(),
});

const internalLink = z.object({
  href: z.string().startsWith('/'),
  anchor: z.string(),
});

const blog = defineCollection({
  // Files live in src/content/blog/<lang>/<slug>.md
  // The generated id is "<lang>/<slug>", e.g. "fr/loyer-appartement-jerusalem".
  // generateId esplicito: altrimenti il loader usa il campo `slug` come id e gli articoli EN/HE
  // con lo stesso slug si sovrascriverebbero.
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().max(60),
    description: z.string().max(155),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    lang: z.enum(['en', 'he', 'fr', 'it']),
    translationKey: z.string(), // same value across translations, used for hreflang
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    cluster: z.string(),
    segment: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
    faq: z.array(faqItem).min(4).max(6),
    sources: z.array(source).min(1),
    internalLinks: z.array(internalLink).default([]),
  }),
});

export const collections = { blog };
