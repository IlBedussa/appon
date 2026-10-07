// Invio delle email in coda (tabella public.email_outbox, riempita dai trigger del DB nella
// stessa transazione del cambiamento -> nessuna notifica persa). Chiamato dopo ogni POST e
// dall'endpoint /api/cron/outbox (Vercel Cron in produzione).
import { adminClient } from './supabase';
import { emailProvider } from './email/provider';
import { renderNotificationEmail } from './email/templates';
import { SITE_URL } from 'astro:env/server';

let running = false;

export async function processOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
  if (running) return { sent: 0, failed: 0 };
  running = true;
  let sent = 0, failed = 0;
  try {
    const db = adminClient();
    const { data: rows } = await db.from('email_outbox').select('*').eq('status', 'queued').lt('attempts', 5).order('created_at').limit(limit);
    for (const r of rows ?? []) {
      try {
        await emailProvider().send(renderNotificationEmail(r.to_email, r.locale, r.kind, r.params ?? {}, SITE_URL));
        await db.from('email_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: r.attempts + 1 }).eq('id', r.id);
        sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await db.from('email_outbox').update({ attempts: r.attempts + 1, last_error: msg.slice(0, 500), status: r.attempts + 1 >= 5 ? 'failed' : 'queued' }).eq('id', r.id);
        failed++;
      }
    }
  } finally {
    running = false;
  }
  return { sent, failed };
}
