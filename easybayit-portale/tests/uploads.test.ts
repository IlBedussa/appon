// Upload diretti su Supabase Storage (URL firmati): regole di tipo/dimensione, EXIF, firma e finalizzazione
// via HTTP contro il server di sviluppo (:4322) con sessioni reali, negazione tra inquilini, verifica degli
// oggetti caricati, pulizia. I test HTTP sono saltati se il server non risponde.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServerClient } from '@supabase/ssr';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { as, service, anon, URL_ } from './helpers';
import { checkDeclared, verifyObject, exifTakenAt, israelLocalToIso, POLICY, MB } from '../src/lib/upload-policy';

const BASE = process.env.SITE_URL ?? 'http://localhost:4322';
const fixture = (f: string) => new Uint8Array(readFileSync(`scripts/fixtures/${f}`));
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

/** JPEG con blocco EXIF (TIFF big-endian): DateTimeOriginal ed eventuale OffsetTimeOriginal. */
function jpegWithExif(base: Uint8Array, dt: string, offset?: string): Uint8Array {
  const entries = offset ? 2 : 1;
  const exifIfd = 26, data = exifIfd + 2 + entries * 12 + 4;
  const t = new Uint8Array(data + 20 + (offset ? 7 : 0));
  const dv = new DataView(t.buffer);
  t.set([0x4d, 0x4d, 0, 0x2a]); dv.setUint32(4, 8);
  dv.setUint16(8, 1); dv.setUint16(10, 0x8769); dv.setUint16(12, 4); dv.setUint32(14, 1); dv.setUint32(18, exifIfd); dv.setUint32(22, 0);
  dv.setUint16(exifIfd, entries);
  const ent = (i: number, tag: number, count: number, off: number) => { const e = exifIfd + 2 + i * 12; dv.setUint16(e, tag); dv.setUint16(e + 2, 2); dv.setUint32(e + 4, count); dv.setUint32(e + 8, off); };
  ent(0, 0x9003, 20, data);
  if (offset) ent(1, 0x9011, 7, data + 20);
  t.set([...dt].map((c) => c.charCodeAt(0)), data);
  if (offset) t.set([...offset].map((c) => c.charCodeAt(0)), data + 20);
  const payload = new Uint8Array([...'Exif'].map((c) => c.charCodeAt(0)).concat([0, 0]).concat([...t]));
  const len = payload.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 0xff, ...payload, ...base.subarray(2)]);
}

describe('regole degli upload (pure)', () => {
  it('rifiuta tipo e dimensione non ammessi per ciascun flusso', () => {
    expect(checkDeclared('maintenance', { name: 'a.jpg', size: 8 * MB, type: 'image/jpeg' }).ok).toBe(true);
    expect(checkDeclared('maintenance', { name: 'a.jpg', size: 8 * MB + 1, type: 'image/jpeg' })).toEqual({ ok: false, reason: 'size' });
    expect(checkDeclared('maintenance', { name: 'v.mp4', size: 50 * MB, type: 'video/mp4' }).ok).toBe(true);
    expect(checkDeclared('maintenance', { name: 'v.mp4', size: 50 * MB + 1, type: 'video/mp4' })).toEqual({ ok: false, reason: 'size' });
    expect(checkDeclared('inspection', { name: 'v.mp4', size: 1000, type: 'video/mp4' })).toEqual({ ok: false, reason: 'type' });
    expect(checkDeclared('document', { name: 'd.pdf', size: 10 * MB, type: 'application/pdf' }).ok).toBe(true);
    expect(checkDeclared('document', { name: 'd.pdf', size: 10 * MB + 1, type: 'application/pdf' })).toEqual({ ok: false, reason: 'size' });
    expect(checkDeclared('maintenance', { name: 'x.html', size: 10, type: 'text/html' })).toEqual({ ok: false, reason: 'type' });
    expect(checkDeclared('webchat', { name: 'd.pdf', size: 10, type: 'application/pdf' })).toEqual({ ok: false, reason: 'type' });
    expect(checkDeclared('maintenance', { name: 'a.jpg', size: 0, type: 'image/jpeg' })).toEqual({ ok: false, reason: 'empty' });
    expect(POLICY.maintenance.maxFiles).toBe(5);
    expect(POLICY.inspection.maxFiles).toBe(10);
    expect(POLICY.document.maxFiles).toBe(1);
  });
  it("verifica dell'oggetto: mancante, dimensione diversa, tipo reale diverso o non ammesso", () => {
    const intent = { declared_size: 100, declared_mime: 'image/png' };
    expect(verifyObject('maintenance', intent, null)).toEqual({ ok: false, reason: 'missing' });
    expect(verifyObject('maintenance', intent, { size: 101, sniffed: 'image/png' })).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifyObject('maintenance', intent, { size: 100, sniffed: 'image/jpeg' })).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifyObject('maintenance', intent, { size: 100, sniffed: null })).toEqual({ ok: false, reason: 'type' });
    expect(verifyObject('inspection', { declared_size: 100, declared_mime: 'video/mp4' }, { size: 100, sniffed: 'video/mp4' })).toEqual({ ok: false, reason: 'type' });
    // un "video" da 20 MB che in realtà è un'immagine: limite delle foto (8 MB)
    expect(verifyObject('maintenance', { declared_size: 20 * MB, declared_mime: 'video/mp4' }, { size: 20 * MB, sniffed: 'image/jpeg' })).toEqual({ ok: false, reason: 'size' });
    expect(verifyObject('maintenance', { declared_size: 100, declared_mime: 'video/quicktime' }, { size: 100, sniffed: 'video/mp4' })).toEqual({ ok: true, mime: 'video/mp4' });
    expect(verifyObject('maintenance', intent, { size: 100, sniffed: 'image/png' })).toEqual({ ok: true, mime: 'image/png' });
  });
  it('data di scatto EXIF: con fuso, senza fuso (ora israeliana), assente o non plausibile', () => {
    const base = fixture('insp-living.jpg');
    expect(exifTakenAt(jpegWithExif(base, '2026:03:31 10:04:00', '+03:00'))).toBe('2026-03-31T07:04:00.000Z');
    expect(exifTakenAt(jpegWithExif(base, '2026:01:15 09:30:00'))).toBe('2026-01-15T07:30:00.000Z'); // inverno UTC+2
    expect(exifTakenAt(jpegWithExif(base, '2026:07:15 09:30:00'))).toBe('2026-07-15T06:30:00.000Z'); // estate UTC+3
    expect(exifTakenAt(base)).toBeNull();
    expect(exifTakenAt(fixture('heater-1.png'))).toBeNull();
    expect(exifTakenAt(jpegWithExif(base, '1970:01:01 00:00:00'))).toBeNull();
    expect(exifTakenAt(jpegWithExif(base, '2099:01:01 00:00:00'))).toBeNull();
    expect(exifTakenAt(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 4, 1, 2]))).toBeNull(); // troncato
  });
  it('ora locale israeliana → ISO', () => {
    expect(israelLocalToIso('2026-03-31T10:04')).toBe('2026-03-31T07:04:00.000Z');
    expect(israelLocalToIso('2026-12-01T10:00')).toBe('2026-12-01T08:00:00.000Z');
    expect(israelLocalToIso('not a date')).toBeNull();
  });
});

// ---------- HTTP contro il server di sviluppo ----------
const up = await fetch(`${BASE}/login`).then((r) => r.ok).catch(() => false);
const d = up ? describe : describe.skip;

type Session = { post: (path: string, body: unknown, extra?: Record<string, string>) => Promise<Response>; sb: SupabaseClient; userId: string };
/** Sessione del portale da una sessione Supabase già autenticata (anche aal2): cookie @supabase/ssr + token CSRF. */
async function session(key: string): Promise<Session> {
  const sb = await as(key);
  const { data: { session: s } } = await sb.auth.getSession();
  const jar = new Map<string, string>();
  const ssr = createServerClient(URL_, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (l) => l.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))) },
  });
  await ssr.auth.setSession({ access_token: s!.access_token, refresh_token: s!.refresh_token });
  const csrf = randomBytes(32).toString('base64url');
  const cookie = [...jar].map(([k, v]) => `${k}=${v}`).concat(`${process.env.COOKIE_SECURE === "false" ? "eb_csrf" : "__Host-eb_csrf"}=${csrf}`).join('; ');
  const post = (path: string, body: unknown, extra: Record<string, string> = {}) => {
    const raw = typeof body === 'string' || body instanceof URLSearchParams || body instanceof FormData;
    return fetch(`${BASE}${path}`, {
      method: 'POST', redirect: 'manual', body: raw ? body : JSON.stringify(body),
      headers: { cookie, origin: BASE, 'x-csrf-token': csrf, ...(raw ? {} : { 'content-type': 'application/json' }), ...extra },
    });
  };
  return { post, sb, userId: s!.user.id };
}
const put = (url: string, bytes: Uint8Array, type: string) => fetch(url, { method: 'PUT', headers: { 'content-type': type, 'x-upsert': 'false' }, body: bytes as BodyInit });
const objectExists = async (bucket: string, path: string) => !(await service().storage.from(bucket).info(path)).error;

let tenant1: Session, tenant2: Session, owner1: Session, staff: Session;
let reqA: string, reqB: string, draftInsp: string, completedInsp: string;
const created: string[] = [];

d('upload diretti via HTTP', () => {
  beforeAll(async () => {
    [tenant1, tenant2, owner1, staff] = [await session('tenant1'), await session('tenant2'), await session('owner1'), await session('staff')];
    const db = service();
    reqA = (await db.from('maintenance_requests').select('id').eq('title', 'Water heater not working').single()).data!.id; // Tenant Alpha (tenant1)
    reqB = (await db.from('maintenance_requests').select('id').eq('title', 'Kitchen tap leaking').single()).data!.id; // Tenant Beta (tenant2)
    const { data: insp } = await db.from('inspections').select('id, status').order('created_at');
    draftInsp = insp!.find((i) => i.status === 'draft')!.id;
    completedInsp = insp!.find((i) => i.status === 'completed')!.id;
  });
  afterAll(async () => {
    const db = service();
    if (created.length) {
      const { data } = await db.from('maintenance_photos').select('id, storage_path').in('id', created);
      const { data: ip } = await db.from('inspection_photos').select('id, storage_path').in('id', created);
      if (data?.length) { await db.storage.from('maintenance-photos').remove(data.map((x) => x.storage_path)); await db.from('maintenance_photos').delete().in('id', data.map((x) => x.id)); }
      if (ip?.length) { await db.storage.from('inspection-photos').remove(ip.map((x) => x.storage_path)); await db.from('inspection_photos').delete().in('id', ip.map((x) => x.id)); }
    }
    for (const s of [tenant1, tenant2, staff]) if (s) await db.from('chat_conversations').delete().eq('external_id', s.userId);
  });

  const sign = (s: Session, kind: string, targetId: string | null, files: { name: string; size: number; type: string }[]) => s.post('/api/uploads/sign', { kind, targetId, files });
  const finalize = (s: Session, kind: string, targetId: string, uploadIds: string[], extra: object = {}) => s.post('/api/uploads/finalize', { kind, targetId, uploadIds, ...extra });

  it('senza sessione: nessun URL firmato', async () => {
    const r = await fetch(`${BASE}/api/uploads/sign`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect([302, 303, 401, 403]).toContain(r.status);
  });

  it('firma: rifiuta tipo, dimensione e numero di file prima di emettere URL', async () => {
    let r = await sign(tenant1, 'maintenance', reqA, [{ name: 'big.jpg', size: 8 * MB + 1, type: 'image/jpeg' }]);
    expect(r.status).toBe(422);
    expect((await r.json()).files[0]).toEqual({ ok: false, reason: 'size' });
    r = await sign(tenant1, 'maintenance', reqA, [{ name: 'ok.jpg', size: 1000, type: 'image/jpeg' }, { name: 'x.html', size: 10, type: 'text/html' }]);
    expect(r.status).toBe(422);
    expect((await r.json()).files).toEqual([{ ok: false, reason: 'skipped' }, { ok: false, reason: 'type' }]);
    r = await sign(tenant1, 'maintenance', reqA, [{ name: 'v.mp4', size: 51 * MB, type: 'video/mp4' }]);
    expect(r.status).toBe(422);
    r = await sign(tenant1, 'maintenance', reqA, Array.from({ length: 6 }, (_, i) => ({ name: `${i}.jpg`, size: 100, type: 'image/jpeg' })));
    expect(r.status).toBe(400);
    r = await sign(staff, 'document', null, [{ name: 'big.pdf', size: 10 * MB + 1, type: 'application/pdf' }]);
    expect(r.status).toBe(422);
    const { count } = await service().from('upload_intents').select('id', { count: 'exact', head: true }).eq('created_by', tenant1.userId).eq('status', 'pending');
    expect(count).toBe(0);
  });

  it('firma: negata tra inquilini, ai proprietari e fuori ruolo', async () => {
    const f = [{ name: 'a.png', size: 100, type: 'image/png' }];
    expect((await sign(tenant2, 'maintenance', reqA, f)).status).toBe(404); // richiesta di un altro inquilino (RLS la nasconde)
    expect((await sign(owner1, 'maintenance', reqA, f)).status).toBe(403);
    expect((await sign(owner1, 'maintenance', null, f)).status).toBe(403);
    expect((await sign(tenant1, 'inspection', draftInsp, f)).status).toBe(403);
    expect((await sign(tenant1, 'document', null, [{ name: 'a.pdf', size: 100, type: 'application/pdf' }])).status).toBe(403);
    expect((await sign(staff, 'inspection', completedInsp, f)).status).toBe(403); // ispezione completata: bloccata
    expect((await sign(staff, 'webchat', null, f)).status).toBe(403);
    expect((await sign(tenant1, 'maintenance', 'not-a-uuid', f)).status).toBe(404);
  });

  it("lo storage non accetta scritture con la sessione dell'utente", async () => {
    const png = fixture('heater-1.png');
    expect((await tenant1.sb.storage.from('maintenance-photos').upload(`${reqA}/direct-${Date.now()}.png`, png, { contentType: 'image/png' })).error).toBeTruthy();
    expect((await tenant1.sb.storage.from('maintenance-photos').createSignedUploadUrl(`${reqA}/direct-${Date.now()}.png`)).error).toBeTruthy();
    expect((await staff.sb.storage.from('documents').upload(`general/direct-${Date.now()}.pdf`, new TextEncoder().encode('%PDF-1.4'), { contentType: 'application/pdf' })).error).toBeTruthy();
    // collegare a una propria richiesta un percorso che sta nella cartella di un'altra: negato
    expect((await tenant1.sb.from('maintenance_photos').insert({ request_id: reqA, storage_path: `${reqB}/x-${Date.now()}.png`, mime_type: 'image/png', size_bytes: 10, uploaded_by: tenant1.userId })).error).toBeTruthy();
  });

  it('flusso completo: firma → PUT diretto → finalizzazione con impronta e collegamento', async () => {
    const png = fixture('heater-1.png');
    const r = await sign(tenant1, 'maintenance', reqA, [{ name: 'heater.png', size: png.length, type: 'image/png' }]);
    expect(r.status).toBe(200);
    const [f] = (await r.json()).files;
    expect(f.ok).toBe(true);
    expect(f.path).toMatch(new RegExp(`^pending/${tenant1.userId}/[0-9a-f-]{36}\\.png$`));
    expect((await put(f.signedUrl, png, 'image/png')).ok).toBe(true);
    // un secondo PUT sullo stesso URL non sovrascrive
    expect((await put(f.signedUrl, fixture('tap-1.jpg'), 'image/jpeg')).ok).toBe(false);
    // un altro inquilino non può finalizzare l'upload altrui (né collegarlo a una sua richiesta)
    const steal = await finalize(tenant2, 'maintenance', reqB, [f.uploadId]);
    expect((await steal.json()).rejected).toEqual([{ uploadId: f.uploadId, reason: 'not_found' }]);
    const fin = await finalize(tenant1, 'maintenance', reqA, [f.uploadId]);
    expect(fin.status).toBe(200);
    const body = await fin.json();
    expect(body.ok[0]).toMatchObject({ mime: 'image/png', size: png.length, sha256: sha(png) });
    created.push(body.ok[0].id);
    const { data: row } = await service().from('maintenance_photos').select('request_id, storage_path, sha256, uploaded_by').eq('id', body.ok[0].id).single();
    expect(row).toMatchObject({ request_id: reqA, sha256: sha(png), uploaded_by: tenant1.userId });
    expect(row!.storage_path.startsWith(`${reqA}/`)).toBe(true);
    expect(await objectExists('maintenance-photos', row!.storage_path)).toBe(true);
    expect(await objectExists('maintenance-photos', f.path)).toBe(false);
    // l'inquilino legge il file (via riga in tabella), l'altro no
    expect((await tenant1.sb.storage.from('maintenance-photos').download(row!.storage_path)).error).toBeNull();
    expect((await tenant2.sb.storage.from('maintenance-photos').download(row!.storage_path)).error).not.toBeNull();
    // seconda finalizzazione dello stesso id: rifiutata
    expect((await (await finalize(tenant1, 'maintenance', reqA, [f.uploadId])).json()).rejected[0].reason).toBe('not_found');
  });

  it('finalizzazione: rifiuta e rimuove file mancanti, di dimensione diversa o con tipo reale diverso', async () => {
    const png = fixture('heater-1.png');
    const fake = new Uint8Array(png.length).fill(0x41); // stessa dimensione ma non è un'immagine
    const r = await sign(tenant1, 'maintenance', reqA, [
      { name: 'missing.png', size: png.length, type: 'image/png' },
      { name: 'short.png', size: png.length, type: 'image/png' },
      { name: 'fake.png', size: png.length, type: 'image/png' },
      { name: 'jpeg-as-png.png', size: fixture('tap-1.jpg').length, type: 'image/png' },
    ]);
    const files = (await r.json()).files;
    await put(files[1].signedUrl, png.subarray(0, png.length - 10), 'image/png');
    await put(files[2].signedUrl, fake, 'image/png');
    await put(files[3].signedUrl, fixture('tap-1.jpg'), 'image/png');
    const fin = await finalize(tenant1, 'maintenance', reqA, files.map((f: any) => f.uploadId));
    expect(fin.status).toBe(422);
    const reasons = Object.fromEntries((await fin.json()).rejected.map((x: any) => [x.uploadId, x.reason]));
    expect(files.map((f: any) => reasons[f.uploadId])).toEqual(['missing', 'mismatch', 'type', 'mismatch']);
    for (const f of files) expect(await objectExists('maintenance-photos', f.path)).toBe(false);
    const { data: st } = await service().from('upload_intents').select('status').in('id', files.map((f: any) => f.uploadId));
    expect(st!.every((x) => x.status === 'rejected')).toBe(true);
  });

  it("finalizzazione: l'upload resta legato al record indicato alla firma", async () => {
    const png = fixture('heater-1.png');
    const { data: other } = await service().from('maintenance_requests').insert({ property_id: (await service().from('maintenance_requests').select('property_id').eq('id', reqA).single()).data!.property_id, tenant_id: (await service().from('maintenance_requests').select('tenant_id').eq('id', reqA).single()).data!.tenant_id, title: 'UPLOAD TEST other', priority: 'routine' }).select('id').single();
    try {
      const [f] = (await (await sign(tenant1, 'maintenance', reqA, [{ name: 'a.png', size: png.length, type: 'image/png' }])).json()).files;
      await put(f.signedUrl, png, 'image/png');
      const fin = await finalize(tenant1, 'maintenance', other!.id, [f.uploadId]);
      expect((await fin.json()).rejected).toEqual([{ uploadId: f.uploadId, reason: 'target' }]);
      expect(await objectExists('maintenance-photos', f.path)).toBe(false);
    } finally { await service().from('maintenance_requests').delete().eq('id', other!.id); }
  });

  it("finalizzazione: RLS nega il collegamento alla richiesta di un altro inquilino", async () => {
    const png = fixture('heater-1.png');
    const [f] = (await (await sign(tenant1, 'maintenance', null, [{ name: 'a.png', size: png.length, type: 'image/png' }])).json()).files;
    await put(f.signedUrl, png, 'image/png');
    // upload firmato per una nuova richiesta, poi collegamento tentato alla richiesta di un altro inquilino
    const fin = await finalize(tenant1, 'maintenance', reqB, [f.uploadId]);
    expect((await fin.json()).rejected[0].reason).toBe('forbidden');
    const { data: leftovers } = await service().from('maintenance_photos').select('id').eq('request_id', reqB).eq('uploaded_by', tenant1.userId);
    expect(leftovers).toHaveLength(0);
  });

  it('ispezione: foto con data di scatto dai metadati EXIF e impronta SHA-256', async () => {
    const jpg = jpegWithExif(fixture('insp-kitchen.jpg'), '2026:03:31 10:11:00', '+03:00');
    const plain = fixture('insp-bedroom.jpg');
    const r = await sign(staff, 'inspection', draftInsp, [{ name: 'k.jpg', size: jpg.length, type: 'image/jpeg' }, { name: 'b.jpg', size: plain.length, type: 'image/jpeg' }]);
    expect(r.status).toBe(200);
    const files = (await r.json()).files;
    await put(files[0].signedUrl, jpg, 'image/jpeg');
    await put(files[1].signedUrl, plain, 'image/jpeg');
    const fin = await finalize(staff, 'inspection', draftInsp, files.map((f: any) => f.uploadId), { caption: 'Kitchen', takenAt: '2026-04-01T09:00' });
    expect(fin.status).toBe(200);
    const body = await fin.json();
    created.push(...body.ok.map((x: any) => x.id));
    const { data: rows } = await service().from('inspection_photos').select('id, taken_at, taken_at_source, sha256, caption, storage_path').in('id', body.ok.map((x: any) => x.id));
    const k = rows!.find((x) => x.sha256 === sha(jpg))!, b = rows!.find((x) => x.sha256 === sha(plain))!;
    expect(new Date(k.taken_at!).toISOString()).toBe('2026-03-31T07:11:00.000Z');
    expect(k.taken_at_source).toBe('exif');
    expect(new Date(b.taken_at!).toISOString()).toBe('2026-04-01T06:00:00.000Z'); // orario manuale (Israele, UTC+3)
    expect(b.taken_at_source).toBe('manual');
    expect(rows!.every((x) => x.caption === 'Kitchen' && x.storage_path.startsWith(`${draftInsp}/`))).toBe(true);
  });

  it('vault documenti: PDF caricato direttamente e collegato dal form della pagina (con impronta)', async () => {
    const pdf = new TextEncoder().encode('%PDF-1.4\n% upload test\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n');
    const [f] = (await (await sign(staff, 'document', null, [{ name: 'test.pdf', size: pdf.length, type: 'application/pdf' }])).json()).files;
    expect((await put(f.signedUrl, pdf, 'application/pdf')).ok).toBe(true);
    const title = `UPLOAD TEST doc ${Date.now()}`;
    const form = new URLSearchParams({ title, category: 'other', remind_days: '30', visible_to_owner: 'on', upload_ids: f.uploadId });
    const r = await staff.post('/admin/documents', form, { 'content-type': 'application/x-www-form-urlencoded' });
    expect(r.status).toBe(303);
    const { data: doc } = await service().from('documents').select('id, storage_path, sha256, mime_type, size_bytes').eq('title', title).single();
    expect(doc).toMatchObject({ sha256: sha(pdf), mime_type: 'application/pdf', size_bytes: pdf.length });
    expect(doc!.storage_path).toMatch(/^general\/[0-9a-f-]{36}\.pdf$/);
    await service().storage.from('documents').remove([doc!.storage_path]);
    await service().from('documents').delete().eq('id', doc!.id);
    // un inquilino non può usare il form del vault (area staff) né finalizzare un documento
    const [g] = (await (await sign(staff, 'document', null, [{ name: 'test.pdf', size: pdf.length, type: 'application/pdf' }])).json()).files;
    await put(g.signedUrl, pdf, 'application/pdf');
    const t = await tenant1.post('/admin/documents', new URLSearchParams({ title: 'x', category: 'other', upload_ids: g.uploadId }), { 'content-type': 'application/x-www-form-urlencoded' });
    expect(t.status).toBe(303);
    expect(t.headers.get('location')).not.toMatch(/admin/);
    expect((await service().from('upload_intents').select('status').eq('id', g.uploadId).single()).data!.status).toBe('pending');
  });
  it('web chat: allegato verificato e consegnato al bot, file temporaneo rimosso; tipo falso rifiutato', async () => {
    const jpg = fixture('tap-1.jpg');
    const [f] = (await (await sign(tenant1, 'webchat', null, [{ name: 'tap.jpg', size: jpg.length, type: 'image/jpeg' }])).json()).files;
    await put(f.signedUrl, jpg, 'image/jpeg');
    const r = await tenant1.post('/tenant/chat/send', { uploadId: f.uploadId });
    expect(r.status).toBe(200);
    expect(await objectExists('maintenance-photos', f.path)).toBe(false);
    const { data: conv } = await service().from('chat_conversations').select('id').eq('external_id', tenant1.userId).is('closed_at', null).single();
    const { data: msgs } = await service().from('chat_messages').select('media').eq('conversation_id', conv!.id).eq('direction', 'in');
    expect(msgs!.some((m: any) => m.media?.[0]?.mime === 'image/jpeg')).toBe(true);
    // allegato falso: rifiutato (422) e rimosso
    const fake = new Uint8Array(100).fill(0x3c);
    const [g] = (await (await sign(tenant1, 'webchat', null, [{ name: 'x.jpg', size: 100, type: 'image/jpeg' }])).json()).files;
    await put(g.signedUrl, fake, 'image/jpeg');
    expect((await tenant1.post('/tenant/chat/send', { uploadId: g.uploadId })).status).toBe(422);
    expect(await objectExists('maintenance-photos', g.path)).toBe(false);
    // multipart con file nel corpo: non più accettato
    const fd = new FormData(); fd.append('file', new Blob([jpg], { type: 'image/jpeg' }), 'tap.jpg');
    const mp = await tenant1.post('/tenant/chat/send', fd);
    expect(mp.status).toBe(415);
  });

  it('corpo della richiesta oltre 4 MB rifiutato (limite Vercel 4,5 MB)', async () => {
    const big = 'x'.repeat(4 * 1024 * 1024 + 10);
    const r = await tenant1.post('/tenant/chat/send', big, { 'content-type': 'text/plain' });
    expect(r.status).toBe(413);
  });

  it('pulizia: intenti scaduti rimossi con il loro oggetto; funzione degli orfani solo per il server', async () => {
    const png = fixture('heater-1.png');
    const [f] = (await (await sign(tenant1, 'maintenance', reqA, [{ name: 'a.png', size: png.length, type: 'image/png' }])).json()).files;
    await put(f.signedUrl, png, 'image/png');
    await service().from('upload_intents').update({ expires_at: new Date(Date.now() - 60_000).toISOString() }).eq('id', f.uploadId);
    // scaduto: non più finalizzabile
    expect((await (await finalize(tenant1, 'maintenance', reqA, [f.uploadId])).json()).rejected[0].reason).toBe('not_found');
    const cron = await fetch(`${BASE}/api/cron/outbox`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
    expect(cron.status).toBe(200);
    expect((await cron.json()).uploads.expired).toBeGreaterThanOrEqual(1);
    expect(await objectExists('maintenance-photos', f.path)).toBe(false);
    expect((await service().from('upload_intents').select('status').eq('id', f.uploadId).single()).data!.status).toBe('expired');
    expect((await tenant1.sb.rpc('stale_pending_uploads')).error).toBeTruthy();
    expect((await anon().rpc('stale_pending_uploads')).error).toBeTruthy();
    expect((await service().rpc('stale_pending_uploads')).error).toBeNull();
    // gli intenti non sono leggibili dai client
    expect((await tenant1.sb.from('upload_intents').select('id')).data ?? []).toHaveLength(0);
  });
});
