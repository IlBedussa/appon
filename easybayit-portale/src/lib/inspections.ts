// Ispezioni fotografiche: caricamento dati (sempre con il client dell'utente → RLS).
// Le foto sono caricate direttamente sullo storage e collegate da direct-upload.ts (finalizeUploads).
import type { SupabaseClient } from '@supabase/supabase-js';

export const INSPECTION_KINDS = ['move_in', 'move_out', 'annual'] as const;
export const CONDITIONS = ['good', 'fair', 'poor', 'na'] as const;
export type InspectionKind = (typeof INSPECTION_KINDS)[number];
export type Condition = (typeof CONDITIONS)[number];

export interface InspectionItem { id: string; room: string; item: string; condition: Condition; note: string; position: number }
export interface InspectionPhoto { id: string; item_id: string | null; caption: string; taken_at: string | null; uploaded_at: string; mime_type: string; size_bytes: number; sha256: string | null; storage_path: string }
export interface InspectionAck { id: string; profile_id: string; role: 'owner' | 'tenant'; acknowledged_at: string; comment: string }
export interface InspectionFull {
  id: string; kind: InspectionKind; status: 'draft' | 'completed'; performed_at: string; summary: string; completed_at: string | null; created_at: string;
  property: { id: string; code: string; name: string; address: string; city: string } | null;
  lease: { id: string; start_date: string; end_date: string; tenant: { full_name: string } | null } | null;
  performer: { full_name: string } | null;
  items: InspectionItem[]; photos: InspectionPhoto[]; acks: InspectionAck[];
}

export async function loadInspection(sb: SupabaseClient, id: string): Promise<InspectionFull | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data: i } = await sb.from('inspections')
    .select('id, kind, status, performed_at, summary, completed_at, created_at, property:properties(id, code, name, address, city), lease:leases(id, start_date, end_date, tenant:tenants(full_name)), performer:profiles!inspections_performed_by_fkey(full_name)')
    .eq('id', id).maybeSingle();
  if (!i) return null;
  const [{ data: items }, { data: photos }, { data: acks }] = await Promise.all([
    sb.from('inspection_items').select('id, room, item, condition, note, position').eq('inspection_id', id).order('position').order('created_at'),
    sb.from('inspection_photos').select('id, item_id, caption, taken_at, uploaded_at, mime_type, size_bytes, sha256, storage_path').eq('inspection_id', id).order('taken_at', { nullsFirst: false }).order('uploaded_at'),
    sb.from('inspection_acks').select('id, profile_id, role, acknowledged_at, comment').eq('inspection_id', id).order('acknowledged_at'),
  ]);
  return { ...(i as any), items: (items ?? []) as InspectionItem[], photos: (photos ?? []) as InspectionPhoto[], acks: (acks ?? []) as InspectionAck[] };
}

/** Raggruppa le voci per stanza mantenendo l'ordine. */
export function byRoom(items: InspectionItem[]): [string, InspectionItem[]][] {
  const m = new Map<string, InspectionItem[]>();
  for (const it of items) m.set(it.room, [...(m.get(it.room) ?? []), it]);
  return [...m.entries()];
}

/** Scarica i byte di alcune foto (per i PDF), rispettando RLS di storage. */
export async function photoBytes(sb: SupabaseClient, photos: InspectionPhoto[], max = 12): Promise<Map<string, Buffer>> {
  const out = new Map<string, Buffer>();
  for (const ph of photos.slice(0, max)) {
    if (ph.mime_type === 'image/webp') continue; // pdfkit supporta solo JPEG/PNG
    const { data } = await sb.storage.from('inspection-photos').download(ph.storage_path);
    if (data) out.set(ph.id, Buffer.from(await data.arrayBuffer()));
  }
  return out;
}
