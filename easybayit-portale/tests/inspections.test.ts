// Ispezioni fotografiche: RLS per ruolo, conferma di presa visione via funzione, immutabilità dopo il
// completamento, storage privato. Contro il DB locale con i dati del seed (`npm run db:reset`).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { as, anon, service, cred } from './helpers';

let staff: SupabaseClient, owner1: SupabaseClient, owner2: SupabaseClient, tenant1: SupabaseClient, tenant2: SupabaseClient;
let completed: { id: string; property_id: string }, draft: { id: string };

beforeAll(async () => {
  [staff, owner1, owner2, tenant1, tenant2] = await Promise.all([as('staff'), as('owner1'), as('owner2'), as('tenant1'), as('tenant2')]);
  const { data } = await service().from('inspections').select('id, status, property_id').order('created_at');
  completed = data!.find((i) => i.status === 'completed')!;
  draft = data!.find((i) => i.status === 'draft')!;
  expect(completed && draft).toBeTruthy();
});

afterAll(async () => {
  // ripristina lo stato del seed: il proprietario non ha ancora confermato
  const { data: u } = await service().from('profiles').select('id').eq('email', cred('owner1').email).single();
  await service().from('inspection_acks').delete().eq('profile_id', u!.id);
  await service().from('inspections').delete().eq('summary', 'test-draft');
});

const ids = async (sb: SupabaseClient) => ((await sb.from('inspections').select('id')).data ?? []).map((r) => r.id).sort();

describe('visibilità per ruolo', () => {
  it('anonimo non vede nulla', async () => {
    for (const t of ['inspections', 'inspection_items', 'inspection_photos', 'inspection_acks']) expect((await anon().from(t).select('id')).data ?? [], t).toHaveLength(0);
  });
  it('staff vede bozze e completate', async () => {
    expect(await ids(staff)).toEqual([completed.id, draft.id].sort());
  });
  it('proprietario: solo le completate dei propri immobili (mai le bozze)', async () => {
    expect(await ids(owner1)).toEqual([completed.id]);
    expect(await ids(owner2)).toEqual([]);
    expect((await owner2.from('inspection_items').select('id').eq('inspection_id', completed.id)).data).toEqual([]);
    expect((await owner1.from('inspection_items').select('id').eq('inspection_id', draft.id)).data).toEqual([]);
  });
  it('inquilino: solo le completate del proprio contratto', async () => {
    expect(await ids(tenant1)).toEqual([completed.id]);
    expect(await ids(tenant2)).toEqual([]);
    expect(((await tenant1.from('inspection_photos').select('id').eq('inspection_id', completed.id)).data ?? []).length).toBe(6);
  });
});

describe('scritture', () => {
  it('proprietario e inquilino non possono creare ispezioni, voci o foto', async () => {
    const row = { property_id: completed.property_id, kind: 'annual', performed_at: '2026-01-01' };
    expect((await tenant1.from('inspections').insert(row)).error).toBeTruthy();
    expect((await owner1.from('inspections').insert(row)).error).toBeTruthy();
    expect((await owner1.from('inspection_items').insert({ inspection_id: completed.id, room: 'X', item: 'Y' })).error).toBeTruthy();
  });
  it('lo staff crea e modifica una bozza, poi la elimina', async () => {
    const { data, error } = await staff.from('inspections').insert({ property_id: completed.property_id, kind: 'annual', performed_at: '2026-01-01', summary: 'test-draft' }).select('id').single();
    expect(error).toBeNull();
    expect((await staff.from('inspection_items').insert({ inspection_id: data!.id, room: 'Kitchen', item: 'Tap', condition: 'good', note: '' })).error).toBeNull();
    expect((await staff.from('inspections').delete().eq('id', data!.id).select('id')).data).toHaveLength(1);
  });
  it('lo staff non può creare un\'ispezione già completata', async () => {
    expect((await staff.from('inspections').insert({ property_id: completed.property_id, kind: 'annual', status: 'completed', completed_at: new Date().toISOString() })).error).toBeTruthy();
  });
});

describe('immutabilità dopo il completamento', () => {
  it('staff: nessuna modifica a ispezione, voci o foto completate', async () => {
    const upd = await staff.from('inspections').update({ summary: 'changed' }).eq('id', completed.id).select('id');
    expect(upd.data ?? []).toHaveLength(0);
    expect((await staff.from('inspection_items').insert({ inspection_id: completed.id, room: 'X', item: 'Y', note: '' })).error).toBeTruthy();
    const del = await staff.from('inspection_photos').delete().eq('inspection_id', completed.id).select('id');
    expect(del.data ?? []).toHaveLength(0);
    expect((await staff.from('inspections').delete().eq('id', completed.id).select('id')).data ?? []).toHaveLength(0);
  });
  it('anche il service role non può modificarla (trigger)', async () => {
    expect((await service().from('inspections').update({ summary: 'changed' }).eq('id', completed.id)).error?.message).toMatch(/completed/);
    expect((await service().from('inspection_items').update({ note: 'x' }).eq('inspection_id', completed.id)).error?.message).toMatch(/read-only/);
    const { data } = await service().from('inspections').select('summary').eq('id', completed.id).single();
    expect(data!.summary).not.toBe('changed');
  });
});

describe('presa visione', () => {
  it('inserimento diretto vietato a tutti i client', async () => {
    const { data: u } = await owner1.auth.getUser();
    expect((await owner1.from('inspection_acks').insert({ inspection_id: completed.id, profile_id: u.user!.id, role: 'owner' })).error).toBeTruthy();
  });
  it('il proprietario conferma tramite funzione (idempotente) e la conferma è nell\'audit', async () => {
    const a = await owner1.rpc('acknowledge_inspection', { p_inspection: completed.id, p_comment: 'Seen, thanks' });
    expect(a.error).toBeNull();
    expect(a.data.role).toBe('owner');
    const b = await owner1.rpc('acknowledge_inspection', { p_inspection: completed.id, p_comment: 'again' });
    expect(b.data.id).toBe(a.data.id);
    expect(b.data.comment).toBe('Seen, thanks');
    const { data: log } = await service().from('audit_log').select('action').eq('entity_id', completed.id).eq('action', 'inspection.acknowledged');
    expect((log ?? []).length).toBeGreaterThanOrEqual(2); // inquilino (seed) + proprietario
  });
  it('altri proprietari, staff e bozze: rifiutato', async () => {
    expect((await owner2.rpc('acknowledge_inspection', { p_inspection: completed.id })).error).toBeTruthy();
    expect((await staff.rpc('acknowledge_inspection', { p_inspection: completed.id })).error).toBeTruthy();
    expect((await tenant1.rpc('acknowledge_inspection', { p_inspection: draft.id })).error).toBeTruthy();
    expect((await tenant2.rpc('acknowledge_inspection', { p_inspection: completed.id })).error).toBeTruthy();
  });
  it('notifica al completamento per proprietario e inquilino', async () => {
    for (const c of [owner1, tenant1]) {
      const { data } = await c.from('notifications').select('kind, link').eq('kind', 'inspection_completed');
      expect((data ?? []).length).toBe(1);
    }
  });
});

describe('storage privato', () => {
  it('foto scaricabile solo da chi vede l\'ispezione', async () => {
    const { data: ph } = await service().from('inspection_photos').select('storage_path').eq('inspection_id', completed.id).limit(1).single();
    expect((await owner1.storage.from('inspection-photos').download(ph!.storage_path)).error).toBeNull();
    expect((await tenant1.storage.from('inspection-photos').download(ph!.storage_path)).error).toBeNull();
    expect((await owner2.storage.from('inspection-photos').download(ph!.storage_path)).data).toBeNull();
    expect((await anon().storage.from('inspection-photos').download(ph!.storage_path)).data).toBeNull();
  });
  it('upload diretto con la sessione: rifiutato per tutti (solo URL firmati emessi dal server)', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect((await tenant1.storage.from('inspection-photos').upload(`${draft.id}/t.png`, png, { contentType: 'image/png' })).error).toBeTruthy();
    expect((await staff.storage.from('inspection-photos').upload(`${completed.id}/s.png`, png, { contentType: 'image/png' })).error).toBeTruthy();
    expect((await staff.storage.from('inspection-photos').upload(`${draft.id}/s-${Date.now()}.png`, png, { contentType: 'image/png' })).error).toBeTruthy();
    expect((await staff.storage.from('inspection-photos').createSignedUploadUrl(`${draft.id}/s-${Date.now()}.png`)).error).toBeTruthy();
  });
  it('collegamento di una foto: il percorso deve stare nella cartella della stessa ispezione', async () => {
    const { data: u } = await staff.auth.getUser();
    const r = await staff.from('inspection_photos').insert({ inspection_id: draft.id, storage_path: `${completed.id}/x-${Date.now()}.png`, mime_type: 'image/png', size_bytes: 10, uploaded_by: u.user!.id });
    expect(r.error).toBeTruthy();
  });
  it('registro eventi: nuove azioni ammesse', async () => {
    expect((await owner1.rpc('log_event', { p_action: 'inspection.pdf_download', p_entity: 'inspections', p_entity_id: completed.id })).error).toBeNull();
    expect((await owner1.rpc('log_event', { p_action: 'report.pdf_download', p_entity: 'properties', p_entity_id: completed.property_id })).error).toBeNull();
  });
});
