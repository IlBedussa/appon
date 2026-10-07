/*
 * ============================================================================
 *  FLAG "TRUST BATCH" — pagine preparate ma DISATTIVATE
 * ============================================================================
 *  SHOW_SERVICE_METRICS  → pagina /service-metrics/ (metriche di servizio dal portale, dati SLA aggregati)
 *  SHOW_TRUST_SECURITY   → pagina /trust-security/ (2FA, cifratura, regione dati, privacy, dati societari)
 *
 *  - Default: SPENTI ovunque (build normale, Vercel, preview). Le pagine NON vengono generate,
 *    non compaiono in sitemap, menu o link.
 *  - Accensione solo esplicita: SHOW_SERVICE_METRICS=1 / SHOW_TRUST_SECURITY=1 al momento della build.
 *  - Prima di accenderle: risolvere i [DA CONFERMARE] in docs/da-compilare.md (sezione "Trust batch").
 *  - Metriche: alla build la pagina legge PORTAL_METRICS_URL (endpoint pubblico del portale
 *    /api/public/sla, a sua volta spento di default con PUBLIC_METRICS_ENABLED). Senza URL o con errore
 *    mostra lo stato "dati non ancora disponibili" — mai numeri inventati.
 * ============================================================================
 */
const on = (v: string | undefined) => v === '1' || v === 'true';
export const SHOW_SERVICE_METRICS: boolean = on(process.env.SHOW_SERVICE_METRICS);
export const SHOW_TRUST_SECURITY: boolean = on(process.env.SHOW_TRUST_SECURITY);
