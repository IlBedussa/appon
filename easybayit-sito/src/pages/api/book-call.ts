// API MOCK per la prenotazione della videochiamata di 15 minuti.
// SOLO BACKEND LOCALE: nessun calendario reale, nessuna email inviata, nessun dato salvato su disco.
// Le prenotazioni restano in memoria del processo (si perdono al riavvio) e il server registra solo
// data/ora e lingua, senza dati personali. La risposta contiene sempre mock: true.
//
// In produzione (VERCEL_ENV=production) risponde 503 finché non viene collegato un backend reale
// (vedi docs/trust-batch.md → "Prenotazione videochiamata: cosa serve per andare live"),
// così nessuna richiesta reale viene persa in silenzio. BOOKING_MOCK=1 forza la modalità mock (es. anteprime).
import type { APIRoute } from 'astro';
import { isValidSlot, BOOKING_LANGS, BOOKING_TOPICS, BOOKING_PLATFORMS } from '../../lib/trust/booking';

export const prerender = false;

const MAX_BODY = 8_000;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();
const booked = new Set<number>(); // slot già presi (in memoria)
const emailRe = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const phoneRe = /^[+()\d\s.-]{7,25}$/;
const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now); hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const env = (k: string) => (import.meta.env[k] as string | undefined) ?? process.env[k];
  if (env('VERCEL_ENV') === 'production' && env('BOOKING_MOCK') !== '1') return json(503, { ok: false, error: 'not_configured' });

  const site = env('SITE_URL');
  const origin = request.headers.get('origin');
  if (site && origin && new URL(site).origin !== origin) return json(403, { ok: false, error: 'origin' });
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return json(415, { ok: false, error: 'type' });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: 'size' });
  let ip = 'unknown';
  try { ip = request.headers.get('x-real-ip') || clientAddress || 'unknown'; } catch { /* non disponibile */ }
  if (rateLimited(ip)) return json(429, { ok: false, error: 'rate' });

  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return json(400, { ok: false, error: 'json' }); }
  if (clean(b.website, 200) !== '') return json(200, { ok: true, mock: true }); // honeypot

  const d = {
    name: clean(b.name, 100), email: clean(b.email, 160), phone: clean(b.phone, 25), notes: clean(b.notes, 1000),
    lang: clean(b.lang, 2), topic: clean(b.topic, 10), platform: clean(b.platform, 10), tz: clean(b.tz, 60),
    utc: Number(b.utc),
  };
  const errors: string[] = [];
  if (d.name.length < 2) errors.push('name');
  if (!emailRe.test(d.email)) errors.push('email');
  if (d.phone && !phoneRe.test(d.phone)) errors.push('phone');
  if (!(BOOKING_LANGS as readonly string[]).includes(d.lang)) errors.push('lang');
  if (!(BOOKING_TOPICS as readonly string[]).includes(d.topic)) errors.push('topic');
  if (!(BOOKING_PLATFORMS as readonly string[]).includes(d.platform)) errors.push('platform');
  try { new Intl.DateTimeFormat('en', { timeZone: d.tz }); } catch { errors.push('tz'); }
  if (!Number.isFinite(d.utc) || !isValidSlot(d.utc)) errors.push('slot');
  if (b.consent !== true) errors.push('consent');
  if (errors.length) return json(422, { ok: false, error: 'invalid', fields: errors });
  if (booked.has(d.utc)) return json(409, { ok: false, error: 'taken' });
  booked.add(d.utc);

  // Nessun dato personale nei log: solo istante, lingua e argomento.
  console.info('[book-call:mock]', new Date(d.utc).toISOString(), d.lang, d.topic, d.platform);
  return json(200, { ok: true, mock: true, id: `EX-${d.utc.toString(36).toUpperCase()}` });
};
