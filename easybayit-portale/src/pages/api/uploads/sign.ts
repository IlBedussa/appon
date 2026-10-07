// Emissione degli URL firmati per il caricamento diretto su Supabase Storage.
// Sessione, 2FA e token CSRF (header x-csrf-token) sono verificati dal middleware.
import type { APIRoute } from 'astro';
import { signUploads } from '../../../lib/direct-upload';
import { isUploadKind } from '../../../lib/upload-policy';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, profile, supabase } = locals;
  if (!user || !profile) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const b = await request.json().catch(() => null);
  if (!b || !isUploadKind(b.kind) || !Array.isArray(b.files) || b.files.length > 20) return Response.json({ error: 'invalid' }, { status: 400 });
  const targetId = typeof b.targetId === 'string' && b.targetId ? b.targetId : null;
  const files = b.files.map((f: any) => ({ name: typeof f?.name === 'string' ? f.name : '', size: Number(f?.size), type: typeof f?.type === 'string' ? f.type : '' }));
  const r = await signUploads({ sb: supabase, userId: user.id, role: profile.role }, b.kind, targetId, files);
  return Response.json('files' in r ? { files: r.files } : { error: r.error }, { status: r.status, headers: { 'cache-control': 'no-store' } });
};
