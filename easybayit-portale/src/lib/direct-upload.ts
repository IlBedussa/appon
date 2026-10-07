// Upload diretti verso Supabase Storage con URL firmati (il file non passa dalle funzioni Vercel,
// che accettano al massimo 4,5 MB per richiesta).
//  1) signUploads: sessione + ruolo + appartenenza del record (letta con il client dell'utente → RLS)
//     + tipo/dimensione dichiarati → intento in DB + URL firmato verso pending/<utente>/<uuid>.<ext>
//  2) il browser carica il file con PUT direttamente sullo storage
//  3) finalizeUploads: l'intento deve essere dell'utente, in attesa e non scaduto; l'oggetto deve esistere,
//     avere la dimensione dichiarata e un tipo reale (magic bytes) ammesso e coerente; si calcolano
//     SHA-256 e (ispezioni) data di scatto EXIF; poi spostamento nella cartella del record e inserimento
//     della riga con il client dell'utente (le policy RLS restano il controllo finale).
// Lo storage non accetta scritture con la sessione dell'utente: solo URL firmati e service role.
import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'node:crypto';
import { adminClient } from './supabase';
import { sniffMime, EXT, type AllowedMime } from './upload';
import { POLICY, checkDeclared, verifyObject, exifTakenAt, type UploadKind, type DeclaredFile, type Bucket } from './upload-policy';
import { isStaffRole, type Role } from './session';
import { hit } from './ratelimit';

export interface UploadCtx { sb: SupabaseClient; userId: string; role: Role }
export type SignedFile = { ok: true; uploadId: string; signedUrl: string; path: string } | { ok: false; reason: 'type' | 'size' | 'empty' | 'skipped' };
export type SignResult = { status: 200 | 422; files: SignedFile[] } | { status: 400 | 403 | 404 | 429 | 500; error: string };

/** Massimo di caricamenti in attesa per utente (protezione da abusi: ogni intento può occupare fino a 50 MB). */
const MAX_PENDING_PER_USER = 40;
const OPEN = (s: string) => !['closed', 'cancelled'].includes(s);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function myTenantId(ctx: UploadCtx): Promise<string | null> {
  const { data } = await ctx.sb.from('tenants').select('id').eq('profile_id', ctx.userId).maybeSingle();
  return data?.id ?? null;
}

/** Autorizzazione al caricamento per tipo e record di destinazione (letture con il client dell'utente → RLS). */
export async function authorizeTarget(ctx: UploadCtx, kind: UploadKind, targetId: string | null): Promise<true | 403 | 404> {
  const staff = isStaffRole(ctx.role);
  if (targetId !== null && !UUID.test(targetId)) return 404;
  switch (kind) {
    case 'maintenance': {
      if (!staff && ctx.role !== 'tenant') return 403;
      if (targetId === null) {
        // nuova richiesta (non ancora creata): solo un inquilino con un contratto in corso o in arrivo
        if (ctx.role !== 'tenant') return 403;
        const { count } = await ctx.sb.from('leases').select('id', { count: 'exact', head: true }).in('status', ['active', 'upcoming']);
        return count ? true : 403;
      }
      const { data: r } = await ctx.sb.from('maintenance_requests').select('id, status, tenant_id').eq('id', targetId).maybeSingle();
      if (!r) return 404;
      if (staff) return true;
      return r.tenant_id && r.tenant_id === (await myTenantId(ctx)) && OPEN(r.status) ? true : 403;
    }
    case 'inspection': {
      if (!staff) return 403;
      if (targetId === null) return 404;
      const { data: i } = await ctx.sb.from('inspections').select('id, status').eq('id', targetId).maybeSingle();
      if (!i) return 404;
      return i.status === 'draft' ? true : 403;
    }
    case 'document':
      return staff ? true : 403;
    case 'webchat':
      return ctx.role === 'tenant' ? true : 403;
  }
}

export async function signUploads(ctx: UploadCtx, kind: UploadKind, targetId: string | null, files: DeclaredFile[]): Promise<SignResult> {
  const policy = POLICY[kind];
  if (!files.length || files.length > policy.maxFiles) return { status: 400, error: 'count' };
  const auth = await authorizeTarget(ctx, kind, targetId);
  if (auth !== true) return { status: auth, error: auth === 404 ? 'not_found' : 'forbidden' };
  if (!(await hit('upload-sign', ctx.userId, 60, 600))) return { status: 429, error: 'rate_limited' };

  const admin = adminClient();
  const { count: pending } = await admin.from('upload_intents').select('id', { count: 'exact', head: true })
    .eq('created_by', ctx.userId).eq('status', 'pending').gt('expires_at', new Date().toISOString());
  if ((pending ?? 0) + files.length > MAX_PENDING_PER_USER) return { status: 429, error: 'too_many_pending' };

  const checks = files.map((f) => checkDeclared(kind, f));
  // un file non valido blocca l'intero invio: nessun URL viene emesso
  if (checks.some((c) => !c.ok)) return { status: 422, files: checks.map((c) => (c.ok ? { ok: false as const, reason: 'skipped' as const } : c)) };

  const out: SignedFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const c = checks[i] as { ok: true; mime: AllowedMime; ext: string };
    const path = `pending/${ctx.userId}/${randomUUID()}.${c.ext}`;
    const { data: intent, error } = await admin.from('upload_intents').insert({
      kind, bucket: policy.bucket, storage_path: path, target_id: targetId, declared_mime: c.mime, declared_size: files[i].size,
      original_name: String(files[i].name ?? '').slice(0, 255), created_by: ctx.userId,
    }).select('id').single();
    if (error || !intent) { console.error('[upload-sign]', error?.message); return { status: 500, error: 'server' }; }
    const signed = await admin.storage.from(policy.bucket).createSignedUploadUrl(path);
    if (signed.error || !signed.data) {
      console.error('[upload-sign]', signed.error?.message);
      await admin.from('upload_intents').delete().eq('id', intent.id);
      return { status: 500, error: 'server' };
    }
    out.push({ ok: true, uploadId: intent.id, signedUrl: signed.data.signedUrl, path });
  }
  return { status: 200, files: out };
}

// ---------- Finalizzazione ----------

export type RejectReason = 'missing' | 'size' | 'type' | 'mismatch' | 'target' | 'forbidden' | 'not_found' | 'server';
export interface FinalizedFile { uploadId: string; path: string; mime: AllowedMime; size: number; sha256: string; takenAt?: string | null; rowId?: string }
export interface FinalizeResult { ok: FinalizedFile[]; rejected: { uploadId: string; reason: RejectReason }[] }

export type DocumentMeta = {
  title: string; category: string; property_id: string | null; owner_id: string | null; tenant_id: string | null; lease_id: string | null;
  visible_to_owner: boolean; visible_to_tenant: boolean; expires_on: string | null; remind_days: number;
};
export type FinalizeLink =
  | { kind: 'maintenance'; requestId: string }
  | { kind: 'inspection'; inspectionId: string; caption?: string; takenAt?: string | null; itemId?: string | null }
  | { kind: 'document'; meta: DocumentMeta }
  | { kind: 'webchat' };

interface IntentRow { id: string; kind: UploadKind; bucket: Bucket; storage_path: string; target_id: string | null; declared_mime: string; declared_size: number }

/** Dimensione reale (metadati dello storage), poi download per tipo reale, SHA-256 e primi byte (EXIF). */
async function inspectObject(bucket: Bucket, path: string, expectedSize: number): Promise<{ size: number; sniffed: AllowedMime | null; sha256: string | null; head: Uint8Array } | null> {
  const st = adminClient().storage.from(bucket);
  const info = await st.info(path);
  if (info.error || !info.data) return null;
  const size = Number(info.data.size ?? -1);
  // dimensione diversa da quella dichiarata: inutile scaricare (verrà rifiutato)
  if (size !== expectedSize) return { size, sniffed: null, sha256: null, head: new Uint8Array() };
  const dl = await st.download(path);
  if (dl.error || !dl.data) return null;
  const hash = createHash('sha256');
  const head: Uint8Array[] = []; let headLen = 0, total = 0;
  const reader = dl.data.stream().getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    hash.update(value); total += value.byteLength;
    if (headLen < 256 * 1024) { head.push(value); headLen += value.byteLength; }
  }
  const h = new Uint8Array(headLen); let o = 0;
  for (const c of head) { h.set(c, o); o += c.byteLength; }
  return { size: total, sniffed: sniffMime(h), sha256: hash.digest('hex'), head: h };
}

export async function finalizeUploads(ctx: UploadCtx, link: FinalizeLink, uploadIds: string[]): Promise<FinalizeResult> {
  const kind = link.kind;
  const policy = POLICY[kind];
  const res: FinalizeResult = { ok: [], rejected: [] };
  const ids = [...new Set(uploadIds.filter((x) => UUID.test(x)))].slice(0, policy.maxFiles);
  for (const x of uploadIds) if (!ids.includes(x)) res.rejected.push({ uploadId: String(x).slice(0, 40), reason: 'not_found' });
  if (!ids.length) return res;
  const admin = adminClient();

  // presa in carico atomica: solo intenti dell'utente, del tipo giusto, in attesa e non scaduti
  const { data: claimed, error } = await admin.from('upload_intents').update({ status: 'finalizing' })
    .in('id', ids).eq('created_by', ctx.userId).eq('kind', kind).eq('status', 'pending').gt('expires_at', new Date().toISOString())
    .select('id, kind, bucket, storage_path, target_id, declared_mime, declared_size');
  if (error) { console.error('[upload-finalize]', error.message); for (const id of ids) res.rejected.push({ uploadId: id, reason: 'server' }); return res; }
  const rows = (claimed ?? []) as IntentRow[];
  for (const id of ids) if (!rows.some((r) => r.id === id)) res.rejected.push({ uploadId: id, reason: 'not_found' });

  const target = link.kind === 'maintenance' ? link.requestId : link.kind === 'inspection' ? link.inspectionId : null;
  const reject = async (r: IntentRow, reason: RejectReason, alsoRemove: string[] = [r.storage_path]) => {
    await admin.storage.from(r.bucket).remove(alsoRemove);
    await admin.from('upload_intents').update({ status: 'rejected', reject_reason: reason }).eq('id', r.id);
    res.rejected.push({ uploadId: r.id, reason });
  };

  for (const r of rows) {
    try {
      if (r.target_id && r.target_id !== target) { await reject(r, 'target'); continue; }
      const facts = await inspectObject(r.bucket, r.storage_path, r.declared_size);
      const v = verifyObject(kind, r, facts);
      if (!v.ok || !facts?.sha256) { await reject(r, v.ok ? 'server' : v.reason); continue; }
      const file: FinalizedFile = { uploadId: r.id, path: r.storage_path, mime: v.mime, size: facts.size, sha256: facts.sha256 };

      if (link.kind === 'webchat') {
        // il motore del bot copia il file nell'area della conversazione; l'originale viene poi rimosso dal chiamante
        await admin.from('upload_intents').update({ status: 'finalized', final_path: r.storage_path, sha256: file.sha256, finalized_at: new Date().toISOString() }).eq('id', r.id);
        res.ok.push(file); continue;
      }

      const folder = link.kind === 'document' ? (link.meta.property_id ?? 'general') : target!;
      const finalPath = `${folder}/${randomUUID()}.${EXT[v.mime]}`;
      const mv = await admin.storage.from(r.bucket).move(r.storage_path, finalPath);
      if (mv.error) { console.error('[upload-finalize] move', mv.error.message); await reject(r, 'server'); continue; }

      let ins: { data: { id: string } | null; error: { message: string; code?: string } | null };
      if (link.kind === 'maintenance') {
        ins = await ctx.sb.from('maintenance_photos').insert({ request_id: target, storage_path: finalPath, mime_type: v.mime, size_bytes: facts.size, uploaded_by: ctx.userId, sha256: facts.sha256 }).select('id').single();
      } else if (link.kind === 'inspection') {
        const exif = exifTakenAt(facts.head);
        file.takenAt = exif ?? link.takenAt ?? null;
        ins = await ctx.sb.from('inspection_photos').insert({
          inspection_id: target, storage_path: finalPath, mime_type: v.mime, size_bytes: facts.size, uploaded_by: ctx.userId, sha256: facts.sha256,
          caption: (link.caption ?? '').slice(0, 200), item_id: link.itemId ?? null, taken_at: file.takenAt, taken_at_source: exif ? 'exif' : link.takenAt ? 'manual' : null,
        }).select('id').single();
      } else {
        ins = await ctx.sb.from('documents').insert({ ...link.meta, storage_path: finalPath, mime_type: v.mime, size_bytes: facts.size, uploaded_by: ctx.userId, sha256: facts.sha256 }).select('id').single();
      }
      if (ins.error || !ins.data) {
        // RLS ha negato il collegamento (record non proprio, chiuso, ispezione completata…)
        console.error('[upload-finalize] link', ins.error?.message);
        await reject(r, ins.error?.code === '42501' || /row-level security/i.test(ins.error?.message ?? '') ? 'forbidden' : 'server', [finalPath]);
        continue;
      }
      file.path = finalPath; file.rowId = ins.data.id;
      await admin.from('upload_intents').update({ status: 'finalized', final_path: finalPath, sha256: file.sha256, finalized_at: new Date().toISOString() }).eq('id', r.id);
      res.ok.push(file);
    } catch (e) {
      console.error('[upload-finalize]', (e as Error).message);
      await reject(r, 'server');
    }
  }
  return res;
}

/** Rimuove un file temporaneo della web chat dopo che il bot lo ha copiato. */
export async function discardPending(bucket: Bucket, path: string) {
  if (path.startsWith('pending/')) await adminClient().storage.from(bucket).remove([path]);
}

// ---------- Pulizia degli upload non finalizzati (cron) ----------

export async function cleanupUploads(limit = 200): Promise<{ expired: number; orphans: number; purged: number }> {
  const admin = adminClient();
  const now = new Date().toISOString();
  let expired = 0, orphans = 0;
  const { data: stale } = await admin.from('upload_intents').select('id, bucket, storage_path')
    .in('status', ['pending', 'finalizing']).lt('expires_at', now).limit(limit);
  const byBucket = new Map<Bucket, string[]>();
  for (const s of stale ?? []) byBucket.set(s.bucket as Bucket, [...(byBucket.get(s.bucket as Bucket) ?? []), s.storage_path]);
  for (const [b, paths] of byBucket) await admin.storage.from(b).remove(paths);
  if (stale?.length) {
    await admin.from('upload_intents').update({ status: 'expired' }).in('id', stale.map((s) => s.id));
    expired = stale.length;
  }
  // oggetti in pending/ senza un intento valido (es. ricaricati dopo la finalizzazione, intenti cancellati)
  const { data: objs } = await admin.rpc('stale_pending_uploads', { p_older_than: '3 hours', p_limit: limit });
  const ob = new Map<Bucket, string[]>();
  for (const o of (objs ?? []) as { bucket_id: Bucket; name: string }[]) ob.set(o.bucket_id, [...(ob.get(o.bucket_id) ?? []), o.name]);
  for (const [b, names] of ob) { const { error } = await admin.storage.from(b).remove(names); if (!error) orphans += names.length; }
  // storico degli intenti conservato 30 giorni
  const { count } = await admin.from('upload_intents').delete({ count: 'exact' })
    .in('status', ['finalized', 'rejected', 'expired']).lt('created_at', new Date(Date.now() - 30 * 86_400_000).toISOString());
  return { expired, orphans, purged: count ?? 0 };
}

/** Id degli upload inviati da un form (campo nascosto upload_ids, uno per file). */
export const uploadIdsFrom = (fd: FormData) => fd.getAll('upload_ids').filter((v): v is string => typeof v === 'string' && UUID.test(v)).slice(0, 20);
