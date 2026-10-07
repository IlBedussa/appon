/*
 * ============================================================================
 *  FLAG UNICO: SHOW_TEST_LOGOS
 * ============================================================================
 *  !!! IMPORTANTE — LEGGERE PRIMA DI PUBBLICARE !!!
 *  I loghi delle autorità israeliane (Rashut HaTaagidim / Corporations Authority,
 *  Rashut HaMisim / Tax Authority, Privacy Protection Authority) NON possono essere
 *  pubblicati senza l'autorizzazione scritta delle autorità stesse. Possono suggerire
 *  un'approvazione, una certificazione o una partnership che NON esiste.
 *  Sono qui SOLO per test locali richiesti da David.
 *
 *  - Default: SPENTO. Una normale `npm run build` NON include i loghi (né i file).
 *  - Acceso solo con la variabile d'ambiente SHOW_TEST_LOGOS=1
 *    (script `npm run build:test` / `npm run preview:test`).
 *  - Quando acceso, accanto ai loghi compare l'etichetta "TEST – remove before publishing".
 *  - Per rimuoverli definitivamente: cancellare la cartella test-assets/authority-logos/,
 *    il componente src/components/TestAuthorityLogos.astro e il suo utilizzo in TrustSection.astro.
 * ============================================================================
 */
export const SHOW_TEST_LOGOS: boolean = process.env.SHOW_TEST_LOGOS === '1' || process.env.SHOW_TEST_LOGOS === 'true';

/*
 * ============================================================================
 *  FLAG: SHOW_DRAFTS (articoli del blog in bozza)
 * ============================================================================
 *  Tutti gli articoli in src/content/blog hanno `draft: true` finché non sono
 *  stati riletti (madrelingua + consulente per legale/fiscale).
 *  - Default: SPENTO. Una normale `npm run build` NON genera le pagine in bozza
 *    (né le elenca in /blog/, nella sitemap o nei link correlati).
 *  - Acceso con SHOW_DRAFTS=1 (script `build:test` / `preview:test`) o in `astro dev`:
 *    le bozze compaiono con il badge "DRAFT – in revisione" e `noindex`.
 *  - Per pubblicare un articolo: risolvere i [DA VERIFICARE] e mettere `draft: false`.
 * ============================================================================
 */
export const SHOW_DRAFTS: boolean =
  process.env.SHOW_DRAFTS === '1' || process.env.SHOW_DRAFTS === 'true' || !!import.meta.env?.DEV;
