// API server-side: riceve i moduli del sito (contatto, richiesta proposta, raccolta email della guida,
// popup lead con variante A/B)
// e li inoltra via email con Resend (https://resend.com).
//
// Variabili d'ambiente (SOLO lato server, mai nel codice client):
//   RESEND_API_KEY   chiave API di Resend. Se manca → MODALITÀ MOCK: niente invio, la richiesta
//                    viene solo registrata nel log del server (utile in locale e in anteprima).
//   LEAD_TO_EMAIL    destinatario/i delle richieste (separati da virgola)   [DA CONFERMARE]
//   LEAD_FROM_EMAIL  mittente verificato su Resend, es. "Easybayit <sito@easybayit.co.il>" [DA CONFERMARE]
//   SITE_URL         origine consentita, es. https://www.easybayit.co.il (controllo Origin; facoltativo)
//   LEAD_MOCK=1      forza la modalità mock anche con la chiave presente
//
// Sicurezza in produzione: se su Vercel (VERCEL_ENV=production) la configurazione Resend è incompleta
// e LEAD_MOCK non è impostato, l'endpoint risponde 503 invece di fingere un invio riuscito:
// così nessuna richiesta reale viene persa in silenzio (il modulo mostra il messaggio di errore).
//
// Protezioni: honeypot ("website"), tempo minimo di compilazione, limite di frequenza per IP
// (in memoria: best effort per istanza serverless), validazione e limiti di lunghezza, controllo Origin,
// dimensione massima del corpo. Nessun dato viene salvato su disco.
import type { APIRoute } from 'astro';

export const prerender = false;

type Kind = 'contact' | 'lead' | 'capture' | 'popup';
const MAX_BODY = 16_000;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

const emailRe = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const phoneRe = /^[+()\d\s.-]{7,25}$/;
const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  return list.length > MAX_PER_WINDOW;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const env = (k: string) => (import.meta.env[k] as string | undefined) ?? process.env[k];

  // Origin: se SITE_URL è impostato, accettiamo solo richieste dal sito stesso.
  const site = env('SITE_URL');
  const origin = request.headers.get('origin');
  if (site && origin && new URL(site).origin !== origin) return json(403, { ok: false, error: 'origin' });

  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return json(415, { ok: false, error: 'type' });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: 'size' });

  let ip = 'unknown';
  // Su Vercel l'IP reale del client è in x-real-ip / x-vercel-forwarded-for (non falsificabili dal client).
  const h = request.headers;
  try { ip = h.get('x-real-ip') || h.get('x-vercel-forwarded-for')?.split(',')[0].trim() || h.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown'; } catch { /* clientAddress non disponibile */ }
  if (rateLimited(ip)) return json(429, { ok: false, error: 'rate' });

  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return json(400, { ok: false, error: 'json' }); }

  // Honeypot o compilazione troppo rapida (< 2,5 s): rispondiamo "ok" senza inviare nulla.
  const elapsed = Number(b.elapsed ?? 0);
  if (clean(b.website, 200) !== '' || (Number.isFinite(elapsed) && elapsed > 0 && elapsed < 2500)) return json(200, { ok: true });

  const kind = (['contact', 'lead', 'capture', 'popup'].includes(String(b.kind)) ? b.kind : 'contact') as Kind;
  const d = {
    name: clean(b.name, 100),
    email: clean(b.email, 160),
    phone: clean(b.phone, 25),
    role: clean(b.role, 60),
    city: clean(b.city, 100),
    message: clean(b.message, 3000),
    company: clean(b.company, 120),
    projects: clean(b.projects, 120),
    context: clean(b.context, 80),
    propertyType: clean(b.propertyType, 40),
    variant: clean(b.variant, 2),   // popup: variante A/B mostrata
    trigger: clean(b.trigger, 12),  // popup: exit / time / scroll / forced
    lang: clean(b.lang, 5),
    page: clean(b.page, 200),
  };
  const errors: string[] = [];
  // Il popup accetta email OPPURE numero WhatsApp; gli altri moduli richiedono l'email.
  if (kind === 'popup') { if (!(emailRe.test(d.email) || (d.phone && phoneRe.test(d.phone)))) errors.push('contact'); }
  else if (!emailRe.test(d.email)) errors.push('email');
  if (kind !== 'capture' && d.name.length < 2) errors.push('name');
  if (kind === 'contact' && d.message.length < 10) errors.push('message');
  if (d.phone && !phoneRe.test(d.phone)) errors.push('phone');
  if (b.consent !== true) errors.push('consent');
  if (errors.length) return json(422, { ok: false, error: 'invalid', fields: errors });

  // Oggetto su una sola riga (niente a capo dal nome o dal contesto).
  const oneLine = (v: string) => v.replace(/[\r\n\t]+/g, ' ');
  const subject = oneLine(`[Easybayit] ${kind === 'capture' ? 'Guide download' : kind === 'lead' ? 'Proposal request' : kind === 'popup' ? `Popup ${d.variant === 'a' ? 'A · management check' : 'B · rent estimate'}` : 'Contact'} — ${d.name || d.email}${d.context ? ` (${d.context})` : ''}`);
  const text = Object.entries({ kind, ...d, ip, at: new Date().toISOString() })
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const key = env('RESEND_API_KEY');
  const to = (env('LEAD_TO_EMAIL') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const from = env('LEAD_FROM_EMAIL');
  const forcedMock = env('LEAD_MOCK') === '1';
  if (!forcedMock && (!key || !to.length || !from) && env('VERCEL_ENV') === 'production') {
    console.error('[lead] configurazione Resend incompleta in produzione: impostare RESEND_API_KEY, LEAD_TO_EMAIL, LEAD_FROM_EMAIL');
    return json(503, { ok: false, error: 'not_configured' });
  }
  if (forcedMock || !key || !to.length || !from) {
    // MODALITÀ MOCK: nessun invio. Registriamo solo l'essenziale (senza messaggio completo).
    console.info('[lead:mock]', subject, `<${d.email || d.phone}>`);
    return json(200, { ok: true, mock: true });
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'User-Agent': 'easybayit-site/1.0' },
      body: JSON.stringify({ from, to, subject, text, ...(d.email ? { reply_to: d.email } : {}), tags: [{ name: 'kind', value: kind }, ...(d.variant ? [{ name: 'variant', value: d.variant }] : [])] }),
    });
    clearTimeout(timer);
    if (!r.ok) {
      console.error('[lead] resend', r.status, (await r.text()).slice(0, 300));
      return json(502, { ok: false, error: 'send' });
    }
    return json(200, { ok: true });
  } catch (e) {
    console.error('[lead] error', (e as Error).message);
    return json(502, { ok: false, error: 'send' });
  }
};

export const ALL: APIRoute = () => json(405, { ok: false, error: 'method' });
