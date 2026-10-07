// Bot di manutenzione: macchina a stati, NLU a regole, firma/parse del webhook WhatsApp e flusso completo via webhook.
import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { step } from '../src/lib/bot/machine';
import { RulesNlu, detectLocale } from '../src/lib/bot/nlu';
import { verifySignature, sign, parseWebhook, buildWebhookPayload, normalizePhone } from '../src/lib/bot/whatsapp';
import type { ConvData, Ctx, Inbound, State } from '../src/lib/bot/types';
import { service } from './helpers';

const nlu = new RulesNlu();
const P1 = { id: 'p1', code: 'TLV-01', name: 'Demo Residence A' };
const P2 = { id: 'p2', code: 'TLV-02', name: 'Sample Loft B' };
const ctx = (over: Partial<Ctx> = {}): Ctx => ({ locale: 'en', tenantName: 'Tenant Alpha', properties: [P1], emergencyPhone: '+972-0-000-0000', maxMedia: 5, ...over });
const msg = (o: Partial<Inbound>): Inbound => ({ channel: 'whatsapp', from: '972500000001', messageId: randomUUID(), ...o });

/** Esegue una sequenza di input sulla macchina, restituendo stato/dati finali e tutte le risposte. */
function run(inputs: Partial<Inbound>[], c = ctx(), media?: (d: ConvData) => ConvData) {
  let state: State = 'start'; let data: ConvData = {}; const replies: string[] = []; let actions: string[] = [];
  for (const i of inputs) {
    if (i.media && media) data = media(data);
    const r = step(state, data, msg(i), c, nlu);
    state = r.state; data = r.data; replies.push(...r.replies.map((x) => x.text)); actions = actions.concat(r.actions.map((a) => a.type));
  }
  return { state, data, replies, actions };
}
const addMedia = (d: ConvData) => ({ ...d, media: [...(d.media ?? []), { path: 'chat/x/a.jpg', mime: 'image/jpeg', size: 10 }] });

describe('macchina a stati', () => {
  it('percorso completo: categoria, descrizione, foto, urgenza, disponibilità, conferma', () => {
    const r = run([{ text: 'Hi' }, { replyId: 'cat:plumbing' }, { text: 'The kitchen tap is dripping all the time' }, { media: [{ id: 'm1', mime: 'image/jpeg' }] },
      { replyId: 'media:done' }, { replyId: 'urg:no' }, { replyId: 'avail:morning' }, { replyId: 'confirm:yes' }], ctx(), addMedia);
    expect(r.state).toBe('done');
    expect(r.actions).toContain('create_request');
    expect(r.data).toMatchObject({ propertyId: 'p1', category: 'plumbing', urgent: false, availability: 'Mornings' });
    expect(r.data.media).toHaveLength(1);
    expect(r.replies.some((t) => t.startsWith('Please confirm'))).toBe(true);
  });
  it('più immobili: chiede quale (per numero o codice)', () => {
    const r1 = run([{ text: 'hello' }], ctx({ properties: [P1, P2] }));
    expect(r1.state).toBe('ask_property');
    const r2 = run([{ text: 'hello' }, { text: '2' }], ctx({ properties: [P1, P2] }));
    expect(r2.data.propertyId).toBe('p2');
    const r3 = run([{ text: 'hello' }, { text: 'it is tlv-01' }], ctx({ properties: [P1, P2] }));
    expect(r3.data.propertyId).toBe('p1');
  });
  it('mittente sconosciuto: nessuna richiesta, messaggio di cortesia', () => {
    const r = run([{ text: 'hello' }], ctx({ properties: [] }));
    expect(r.state).toBe('unknown_sender');
    expect(r.replies[0]).toMatch(/not linked/);
  });
  it('emergenza gas nel primo messaggio: urgente + numero di emergenza, salta la domanda sull’urgenza', () => {
    const r = run([{ text: 'There is a strong gas smell in the kitchen!' }, { replyId: 'media:skip' }], ctx());
    expect(r.data).toMatchObject({ emergency: 'gas', urgent: true, category: 'gas' });
    expect(r.replies.join('\n')).toMatch(/EMERGENCY.*\+972-0-000-0000/s);
    expect(r.state).toBe('ask_availability');
  });
  it('emergenze multilingua: allagamento (IT), blackout (HE), sicurezza (FR), gas (RU)', () => {
    expect(nlu.understand('Il bagno è allagato, acqua ovunque', 'it').emergency).toBe('flood');
    expect(nlu.understand('אין חשמל בכל הדירה', 'he').emergency).toBe('power');
    expect(nlu.understand('Tentative d’effraction, la porte ne ferme plus', 'fr').emergency).toBe('security');
    expect(nlu.understand('Сильный запах газа на кухне', 'ru').emergency).toBe('gas');
  });
  it('categoria da testo libero e da numero', () => {
    expect(run([{ text: 'hi' }, { text: 'the boiler does not heat' }]).data.category).toBe('heating_ac');
    expect(run([{ text: 'hi' }, { text: 'the boiler is leaking water' }]).data.category).toBe('heating_ac');
    expect(run([{ text: 'hi' }, { text: 'la caldaia perde acqua' }]).data.category).toBe('heating_ac');
    expect(run([{ text: 'hi' }, { text: '2' }]).data.category).toBe('electrical');
  });
  it('input non valido: ripete con un avviso, dopo 3 tentativi ripropone le opzioni', () => {
    const r = run([{ text: 'hi' }, { text: 'xyz' }, { text: 'qqq' }, { text: '???' }]);
    expect(r.state).toBe('ask_category');
    expect(r.replies.filter((t) => t.includes('did not understand'))).toHaveLength(3);
    expect(r.replies.at(-1)).toMatch(/What kind of problem/);
  });
  it('descrizione troppo corta', () => {
    const r = run([{ text: 'hi' }, { replyId: 'cat:other' }, { text: 'broken' }]);
    expect(r.state).toBe('ask_description');
  });
  it('annullamento in qualsiasi momento (anche in ebraico)', () => {
    const r = run([{ text: 'hi' }, { replyId: 'cat:plumbing' }, { text: 'ביטול' }]);
    expect(r.state).toBe('cancelled');
    expect(r.actions).toContain('close');
  });
  it('ricomincia dalla conferma', () => {
    const r = run([{ text: 'hi' }, { replyId: 'cat:pests' }, { text: 'cockroaches in the kitchen at night' }, { replyId: 'media:skip' }, { replyId: 'urg:no' }, { text: 'evenings' }, { replyId: 'confirm:restart' }]);
    expect(r.state).toBe('ask_category');
    expect(r.data.category).toBeUndefined();
  });
  it('limite di file: al massimo passa avanti automaticamente', () => {
    const many = Array.from({ length: 2 }, () => ({ media: [{ id: 'x', mime: 'image/jpeg' }] }));
    const r = run([{ text: 'hi' }, { replyId: 'cat:other' }, { text: 'window glass cracked in bedroom' }, ...many], ctx({ maxMedia: 2 }), addMedia);
    expect(r.state).toBe('ask_urgency');
  });
  it('lingue: testi nella lingua della conversazione e rilevamento dalla scrittura', () => {
    expect(run([{ text: 'שלום' }], ctx({ locale: 'he' })).replies[0]).toMatch(/שלום/);
    expect(run([{ text: 'Bonjour' }], ctx({ locale: 'fr' })).replies[0]).toMatch(/Bonjour/);
    expect(run([{ text: 'Привет' }], ctx({ locale: 'ru' })).replies[0]).toMatch(/Здравствуйте/);
    expect(detectLocale('שלום, יש נזילה')).toBe('he');
    expect(detectLocale('Здравствуйте')).toBe('ru');
    expect(detectLocale('Ciao, perdita in bagno')).toBe('it');
    expect(detectLocale('hello')).toBe('en');
  });
});

describe('webhook WhatsApp: firma e parsing', () => {
  const secret = 'test-secret';
  it('firma valida / non valida / assente / malformata', () => {
    const body = '{"a":1}';
    expect(verifySignature(body, sign(body, secret), secret)).toBe(true);
    expect(verifySignature(body + ' ', sign(body, secret), secret)).toBe(false);
    expect(verifySignature(body, sign(body, 'other'), secret)).toBe(false);
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, 'sha256=zz', secret)).toBe(false);
    expect(verifySignature(body, sign(body, secret), '')).toBe(false);
  });
  it('payload Meta: testo, immagine, video, risposta a pulsante; ignora gli stati', () => {
    const p = buildWebhookPayload({ from: '972500000001', id: 'wamid.1', text: 'hello' });
    expect(parseWebhook(p)).toEqual([expect.objectContaining({ channel: 'whatsapp', from: '972500000001', messageId: 'wamid.1', text: 'hello' })]);
    expect(parseWebhook(buildWebhookPayload({ from: '1', id: '2', media: { id: 'MID', mime: 'video/mp4' } }))[0].media).toEqual([{ id: 'MID', mime: 'video/mp4' }]);
    expect(parseWebhook(buildWebhookPayload({ from: '1', id: '3', replyId: 'cat:gas', replyTitle: 'Gas' }))[0]).toMatchObject({ replyId: 'cat:gas', text: 'Gas' });
    const statuses = { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { statuses: [{ id: 'x', status: 'delivered' }] } }] }] };
    expect(parseWebhook(statuses)).toEqual([]);
    expect(parseWebhook({ object: 'page' })).toEqual([]);
  });
  it('normalizzazione numeri', () => {
    expect(normalizePhone('+972 50-000-0001')).toBe('972500000001');
    expect(normalizePhone('050-000-0001')).toBe('972500000001');
    expect(normalizePhone('00972500000001')).toBe('972500000001');
  });
});

// ---------- integrazione: webhook reale sul server di sviluppo ----------
const BASE = process.env.SITE_URL ?? 'http://localhost:4322';
const SECRET = process.env.WHATSAPP_APP_SECRET ?? '';
// BOT_E2E=1 forza i test (falliscono se il server non risponde), BOT_E2E=0 li disattiva; default: attivi se il server locale è raggiungibile
const E2E = process.env.BOT_E2E;
const reachable = SECRET && E2E !== '0' ? await fetch(`${BASE}/login`).then((r) => r.ok).catch(() => false) : false;
if (E2E === '1' && !reachable) throw new Error(`BOT_E2E=1 ma il server di sviluppo ${BASE} non risponde o WHATSAPP_APP_SECRET manca`);
const up = reachable;
const PHONE = '972500000002'; // Tenant Beta (seed), HFA-01, profilo in francese
const post = async (body: object, sig?: string) => {
  const raw = JSON.stringify(body);
  return fetch(`${BASE}/api/whatsapp/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig ?? sign(raw, SECRET) }, body: raw });
};
const say = (o: { text?: string; replyId?: string; media?: { id: string; mime: string } }, id = `wamid.TEST.${randomUUID()}`) => post(buildWebhookPayload({ from: PHONE, id, ...o }));
let createdId: string | undefined;
afterAll(async () => {
  if (createdId) await service().from('maintenance_requests').delete().eq('id', createdId);
  if (up) await service().from('chat_conversations').delete().eq('external_id', PHONE);
});

(up ? describe : describe.skip)('webhook end-to-end (server locale)', () => {
  it('verifica sottoscrizione GET', async () => {
    const ok = await fetch(`${BASE}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(process.env.WHATSAPP_VERIFY_TOKEN ?? '')}&hub.challenge=12345`);
    expect(await ok.text()).toBe('12345');
    expect((await fetch(`${BASE}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1`)).status).toBe(403);
  });
  it('firma errata -> 401, nessuna elaborazione', async () => {
    const r = await post(buildWebhookPayload({ from: PHONE, id: 'wamid.bad', text: 'hi' }), 'sha256=' + '0'.repeat(64));
    expect(r.status).toBe(401);
  });
  it('conversazione completa con foto -> richiesta reale nel DB, media salvati, staff notificato, stato rimandato in chat', async () => {
    await service().from('chat_conversations').delete().eq('external_id', PHONE);
    // media: caricato nel simulatore come farebbe la Media API
    const fd = new FormData();
    fd.append('file', new Blob([readFileSync('scripts/fixtures/tap-1.jpg')], { type: 'image/jpeg' }), 'tap.jpg');
    const csrfRes = await fetch(`${BASE}/dev/whatsapp-sim`);
    const cookie = csrfRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    const token = /data-csrf="([^"]+)"/.exec(await csrfRes.text())![1];
    const up = await fetch(`${BASE}/dev/whatsapp-sim/media`, { method: 'POST', headers: { cookie, 'x-csrf-token': token, origin: BASE }, body: fd }).then((r) => r.json());

    const first = `wamid.TEST.${randomUUID()}`;
    await say({ text: 'Bonjour' }, first);
    // idempotenza: lo stesso id consegnato due volte non viene rielaborato
    const dup = await (await say({ text: 'Bonjour' }, first)).json();
    expect(dup.results[0]).toMatchObject({ processed: false, duplicate: true });
    await say({ replyId: 'cat:plumbing' });
    await say({ text: 'Le robinet de la cuisine fuit sans arrêt' });
    await say({ media: up });
    await say({ replyId: 'media:done' });
    await say({ replyId: 'urg:yes' });
    await say({ replyId: 'avail:afternoon' });
    const last = await (await say({ replyId: 'confirm:yes' })).json();
    expect(last.results[0].state).toBe('done');
    createdId = last.results[0].requestId;
    const { data: req } = await service().from('maintenance_requests').select('ref, priority, source, category, availability, created_at, maintenance_photos(mime_type), property:properties(code)').eq('id', createdId!).single();
    expect(req).toMatchObject({ priority: 'urgent', source: 'whatsapp', category: 'plumbing', availability: 'Après-midi', property: { code: 'HFA-01' } });
    expect(req!.maintenance_photos).toHaveLength(1);
    const { data: notes } = await service().from('notifications').select('kind').eq('kind', 'maint.new').contains('params', { ref: req!.ref });
    expect(notes!.length).toBeGreaterThan(0);
    // messaggi del bot in francese, con numero di ticket
    const { data: conv } = await service().from('chat_conversations').select('id, closed_at').eq('request_id', createdId!).single();
    const { data: out } = await service().from('chat_messages').select('body').eq('conversation_id', conv!.id).eq('direction', 'out').order('id');
    expect(out!.at(-1)!.body).toContain(`R-${req!.ref}`);
    expect(out!.at(-1)!.body).toMatch(/Demande/);
    expect(conv!.closed_at).not.toBeNull();
    // lo staff prende in carico -> aggiornamento di stato in chat
    await service().from('maintenance_requests').update({ status: 'in_review' }).eq('id', createdId!);
    await post(buildWebhookPayload({ from: '972509999999', id: `wamid.TEST.${randomUUID()}`, text: 'ping' })); // innesca l'elaborazione della coda
    await expect.poll(async () => (await service().from('chat_messages').select('body').eq('conversation_id', conv!.id).order('id', { ascending: false }).limit(1).single()).data!.body, { timeout: 10000 }).toMatch(/en cours d’examen/);
    await service().from('chat_conversations').delete().eq('external_id', '972509999999');
  });
});
