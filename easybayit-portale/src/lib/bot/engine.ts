// Motore del bot: collega la macchina a stati (pura) a DB, storage e provider del canale.
// Usato dal webhook WhatsApp, dal simulatore locale e dalla web chat del portale.
import { randomUUID } from 'node:crypto';
import { adminClient } from '../supabase';
import { checkUpload, EXT, IMAGE_MIMES, VIDEO_MIMES } from '../upload';
import { MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from '../upload-policy';
import { step } from './machine';
import { createNlu, detectLocale } from './nlu';
import { botStrings, fillB, statusText } from './i18n';
import { botConfig, providerFor } from './config';
import type { BotLocale, ConvData, Inbound, Outbound, PropertyOption, State } from './types';
import type { ChatProvider } from './provider';

const LOCALES: BotLocale[] = ['en', 'he', 'it', 'fr', 'ru'];
const TERMINAL: State[] = ['done', 'cancelled', 'unknown_sender'];

interface Sender { tenantIds: string[]; profileId: string | null; name: string | null; locale: BotLocale | null; properties: PropertyOption[] }

/** Riconosce l'inquilino: numero WhatsApp normalizzato oppure profilo autenticato (web chat). */
async function resolveSender(inb: Inbound): Promise<Sender> {
  const db = adminClient();
  const q = db.from('tenants').select('id, full_name, profile_id, profile:profiles(locale)');
  const { data: tenants } = inb.channel === 'whatsapp' ? await q.eq('phone_digits', inb.from) : await q.eq('profile_id', inb.from);
  const ids = (tenants ?? []).map((t) => t.id);
  let properties: PropertyOption[] = [];
  if (ids.length) {
    const { data: leases } = await db.from('leases').select('property:properties(id, code, name)').in('tenant_id', ids).in('status', ['active', 'upcoming']);
    const seen = new Map<string, PropertyOption>();
    for (const l of leases ?? []) { const p = l.property as any; if (p) seen.set(p.id, { id: p.id, code: p.code, name: p.name }); }
    properties = [...seen.values()].sort((a, b) => a.code.localeCompare(b.code));
  }
  const t = tenants?.[0] as any;
  const loc = t?.profile?.locale;
  return { tenantIds: ids, profileId: t?.profile_id ?? null, name: t?.full_name ?? null, locale: LOCALES.includes(loc) ? loc : null, properties };
}

async function sendAll(provider: ChatProvider, convId: string, to: string, replies: Outbound[]) {
  const db = adminClient();
  for (const r of replies) {
    let pid: string | null = null;
    try { pid = (await provider.send(to, r)).id; } catch (e) { console.error('[bot] send', (e as Error).message); }
    await db.from('chat_messages').insert({ conversation_id: convId, direction: 'out', body: r.text, buttons: r.buttons ?? null, provider_message_id: pid });
  }
}

export interface HandleResult { processed: boolean; duplicate?: boolean; conversationId?: string; state?: State; requestId?: string; requestRef?: number }

export async function handleInbound(inb: Inbound, provider: ChatProvider = providerFor(inb.channel)): Promise<HandleResult> {
  const db = adminClient();
  // 1) idempotenza
  const { data: first, error: claimErr } = await db.rpc('chat_claim_message', { p_provider: inb.channel, p_message_id: inb.messageId });
  if (claimErr) throw new Error(claimErr.message);
  if (!first) return { processed: false, duplicate: true };

  // 2) mittente, conversazione aperta
  const sender = await resolveSender(inb);
  let { data: conv } = await db.from('chat_conversations').select('*').eq('channel', inb.channel).eq('external_id', inb.from).is('closed_at', null).maybeSingle();
  if (!conv) {
    const locale = sender.locale ?? detectLocale(inb.text);
    const ins = await db.from('chat_conversations').insert({ channel: inb.channel, external_id: inb.from, tenant_id: sender.tenantIds[0] ?? null, locale, state: 'start' }).select('*').single();
    if (ins.error) {
      // corsa tra due messaggi simultanei: si riusa la conversazione creata dall'altro
      conv = (await db.from('chat_conversations').select('*').eq('channel', inb.channel).eq('external_id', inb.from).is('closed_at', null).single()).data;
    } else conv = ins.data;
  }
  const locale = conv.locale as BotLocale;
  const s = botStrings[locale];
  let data = (conv.data ?? {}) as ConvData;
  await db.from('chat_messages').insert({ conversation_id: conv.id, direction: 'in', body: (inb.text ?? '').slice(0, 5000), media: inb.media ?? null, provider_message_id: inb.messageId });

  // 3) media: scaricati dal provider, verificati (tipo reale/dimensione) e salvati in area temporanea della conversazione
  const extra: Outbound[] = [];
  if (inb.media?.length && !TERMINAL.includes(conv.state) && conv.state !== 'start' && sender.properties.length) {
    const list = [...(data.media ?? [])];
    for (const m of inb.media) {
      if (list.length >= botConfig.maxMedia) break;
      try {
        const file = await provider.downloadMedia(m.id);
        const chk = await checkUpload(new File([file.bytes as BlobPart], 'm'), [...IMAGE_MIMES, ...VIDEO_MIMES], (mm) => (mm.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES));
        if (!chk.ok) { extra.push({ text: s.notUnderstood }); continue; }
        const path = `chat/${conv.id}/${randomUUID()}.${EXT[chk.mime]}`;
        const up = await db.storage.from('maintenance-photos').upload(path, chk.bytes, { contentType: chk.mime });
        if (up.error) throw new Error(up.error.message);
        list.push({ path, mime: chk.mime, size: chk.size });
      } catch (e) { console.error('[bot] media', (e as Error).message); extra.push({ text: s.notUnderstood }); }
    }
    data = { ...data, media: list };
  }

  // 4) macchina a stati
  const res = step(conv.state as State, data, inb, {
    locale, tenantName: sender.name ?? inb.profileName ?? null, properties: sender.properties, emergencyPhone: botConfig.emergencyPhone, maxMedia: botConfig.maxMedia,
  }, createNlu(botConfig.nlu));
  const replies = [...extra, ...res.replies];
  let requestId: string | undefined, requestRef: number | undefined;
  let closed = false;

  for (const a of res.actions) {
    if (a.type === 'close') closed = true;
    if (a.type === 'create_request') {
      const d = res.data;
      const en = botStrings.en;
      const desc = d.description ?? '';
      const tenantId = sender.tenantIds[0] ?? null;
      const ins = await db.from('maintenance_requests').insert({
        property_id: d.propertyId, tenant_id: tenantId, created_by: sender.profileId,
        title: `${d.category ? en.cats[d.category] : 'Maintenance'}: ${desc}`.slice(0, 140),
        description: `${desc}\n\n— ${inb.channel === 'whatsapp' ? 'WhatsApp' : 'Web chat'} · availability: ${d.availability ?? '—'}${d.emergency ? ` · EMERGENCY: ${d.emergency}` : ''}`.slice(0, 4000),
        priority: d.urgent ? 'urgent' : 'routine', source: inb.channel, category: d.category ?? null, availability: d.availability ?? null, emergency: d.emergency ?? null,
      }).select('id, ref').single();
      if (ins.error) { console.error('[bot] create', ins.error.message); replies.push({ text: s.notUnderstood }); continue; }
      requestId = ins.data.id; requestRef = ins.data.ref;
      // sposta i media nella cartella della richiesta e li collega
      for (const m of d.media ?? []) {
        const dest = `${requestId}/${m.path.split('/').pop()}`;
        const mv = await db.storage.from('maintenance-photos').move(m.path, dest);
        if (mv.error) { console.error('[bot] move', mv.error.message); continue; }
        await db.from('maintenance_photos').insert({ request_id: requestId, storage_path: dest, mime_type: m.mime, size_bytes: m.size, uploaded_by: sender.profileId });
      }
      replies.push({ text: fillB(s.created, { ref: `R-${requestRef}` }) });
      closed = true;
    }
  }

  // 5) salva stato e risponde
  await db.from('chat_conversations').update({
    state: res.state, data: res.data, last_inbound_at: new Date().toISOString(), tenant_id: conv.tenant_id ?? sender.tenantIds[0] ?? null,
    ...(requestId ? { request_id: requestId } : {}), ...(closed ? { closed_at: new Date().toISOString() } : {}),
  }).eq('id', conv.id);
  await sendAll(provider, conv.id, inb.from, replies);
  return { processed: true, conversationId: conv.id, state: res.state, requestId, requestRef };
}

/** Aggiornamenti di stato delle richieste -> chat (WhatsApp o web chat), nella lingua della conversazione. */
export async function processChatOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
  const db = adminClient();
  const { data: rows } = await db.from('chat_outbox').select('id, kind, params, attempts, conversation:chat_conversations(id, channel, external_id, locale)').is('sent_at', null).lt('attempts', 5).order('created_at').limit(limit);
  let sent = 0, failed = 0;
  for (const r of rows ?? []) {
    const c = r.conversation as any;
    if (!c) continue;
    const loc = (LOCALES.includes(c.locale) ? c.locale : 'en') as BotLocale;
    const p = r.params as { ref: number; status: string; scheduled_for?: string | null };
    let text = fillB(botStrings[loc].status, { ref: `R-${p.ref}`, status: statusText[loc][p.status] ?? p.status });
    if (p.status === 'scheduled' && p.scheduled_for) text += ` (${new Intl.DateTimeFormat(loc === 'he' ? 'he-IL' : loc, { dateStyle: 'medium' }).format(new Date(p.scheduled_for))})`;
    try {
      // nota: fuori dalla finestra di 24 h WhatsApp richiede un template approvato (vedi README)
      const res = await providerFor(c.channel).send(c.external_id, { text });
      await db.from('chat_messages').insert({ conversation_id: c.id, direction: 'out', body: text, provider_message_id: res.id });
      await db.from('chat_outbox').update({ sent_at: new Date().toISOString(), attempts: r.attempts + 1 }).eq('id', r.id);
      sent++;
    } catch (e) {
      await db.from('chat_outbox').update({ attempts: r.attempts + 1, last_error: String((e as Error).message).slice(0, 500) }).eq('id', r.id);
      failed++;
    }
  }
  return { sent, failed };
}
