// Finalizzazione degli upload diretti per record già esistenti (foto/video di una richiesta di manutenzione,
// foto di un'ispezione in bozza). I form del portale finalizzano nello stesso POST della pagina; questo
// endpoint JSON serve ai client che caricano senza ricaricare la pagina.
import type { APIRoute } from 'astro';
import { finalizeUploads, type FinalizeLink } from '../../../lib/direct-upload';
import { israelLocalToIso } from '../../../lib/upload-policy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, profile, supabase } = locals;
  if (!user || !profile) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const b = await request.json().catch(() => null);
  const ids = Array.isArray(b?.uploadIds) ? b.uploadIds.filter((x: unknown): x is string => typeof x === 'string').slice(0, 20) : [];
  if (!ids.length || typeof b?.targetId !== 'string' || !UUID.test(b.targetId)) return Response.json({ error: 'invalid' }, { status: 400 });
  let link: FinalizeLink;
  if (b.kind === 'maintenance') link = { kind: 'maintenance', requestId: b.targetId };
  else if (b.kind === 'inspection') {
    const taken = typeof b.takenAt === 'string' ? israelLocalToIso(b.takenAt) : null;
    link = { kind: 'inspection', inspectionId: b.targetId, caption: typeof b.caption === 'string' ? b.caption.slice(0, 200) : '', takenAt: taken, itemId: typeof b.itemId === 'string' && UUID.test(b.itemId) ? b.itemId : null };
  } else return Response.json({ error: 'invalid' }, { status: 400 });
  const r = await finalizeUploads({ sb: supabase, userId: user.id, role: profile.role }, link, ids);
  const status = r.ok.length ? 200 : r.rejected.some((x) => x.reason === 'server') ? 500 : 422;
  return Response.json({ ok: r.ok.map((f) => ({ uploadId: f.uploadId, id: f.rowId, mime: f.mime, size: f.size, sha256: f.sha256, takenAt: f.takenAt ?? null })), rejected: r.rejected }, { status, headers: { 'cache-control': 'no-store' } });
};
