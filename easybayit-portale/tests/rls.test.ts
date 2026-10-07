// Test della Row Level Security e delle funzioni privilegiate, contro il DB locale con i dati del seed.
// Eseguire dopo `npm run db:reset` (seed incluso).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { as, anon, service } from './helpers';

let admin: SupabaseClient, staff: SupabaseClient, owner1: SupabaseClient, owner2: SupabaseClient, tenant1: SupabaseClient, tenant2: SupabaseClient;
const codes = async (sb: SupabaseClient) => ((await sb.from('properties').select('code')).data ?? []).map((p) => p.code).sort();

beforeAll(async () => {
  [admin, staff, owner1, owner2, tenant1, tenant2] = await Promise.all([as('admin'), as('staff'), as('owner1'), as('owner2'), as('tenant1'), as('tenant2')]);
});

// pulizia anche in caso di test falliti
afterAll(async () => { await service().from('maintenance_requests').delete().in('title', ['Test auto-approval', 'SLA test']); });

describe('isolamento per ruolo', () => {
  it('anonimo non vede nulla', async () => {
    const a = anon();
    for (const t of ['properties', 'owners', 'tenants', 'leases', 'statements', 'payments', 'documents', 'maintenance_requests', 'audit_log', 'profiles', 'chat_conversations', 'chat_messages', 'inspections', 'notifications']) {
      const { data } = await a.from(t).select('id').limit(1);
      expect(data ?? [], t).toHaveLength(0);
    }
  });
  it('anonimo: nessun permesso di tabella sulla chat (non solo righe filtrate da RLS)', async () => {
    const { error } = await anon().from('chat_messages').select('id').limit(1);
    expect(error?.code).toBe('42501');
  });
  it('il proprietario vede solo i propri immobili', async () => {
    expect(await codes(owner1)).toEqual(['JLM-01', 'TLV-01', 'TLV-02']);
    expect(await codes(owner2)).toEqual(['HFA-01', 'NTN-01']);
  });
  it('proprietario con 2FA attiva ma sessione aal1: nessun dato finché non verifica', async () => {
    const o2 = await as('owner2', false);
    expect(await codes(o2)).toEqual([]);
  });
  it('staff senza 2FA verificata (aal1) non vede nulla; con aal2 vede tutto', async () => {
    const s1 = await as('staff', false);
    expect(await codes(s1)).toEqual([]);
    expect((await codes(staff)).length).toBe(6);
  });
  it('inquilino vede solo il proprio contratto e il proprio immobile', async () => {
    const { data: leases } = await tenant1.from('leases').select('id, property:properties(code)');
    expect(leases?.map((l: any) => l.property.code)).toEqual(['TLV-01']);
    expect(await codes(tenant1)).toEqual(['TLV-01']);
  });
  it("inquilino non vede rendiconti, pagamenti altrui né l'anagrafica proprietari", async () => {
    expect((await tenant1.from('statements').select('id')).data).toEqual([]);
    expect((await tenant1.from('owners').select('id')).data).toEqual([]);
    const { data: pays } = await tenant1.from('payments').select('property_id, kind, properties(code)');
    expect(new Set(pays?.map((p: any) => p.properties.code))).toEqual(new Set(['TLV-01']));
    expect(pays?.every((p) => p.kind === 'rent' || p.kind === 'deposit')).toBe(true);
  });
  it('rendiconti in bozza invisibili al proprietario', async () => {
    const { data: all } = await staff.from('statements').select('id, status').eq('status', 'draft');
    const { data: mine } = await owner1.from('statements').select('id, status');
    expect(mine?.some((s) => s.status === 'draft')).toBe(false);
    expect((all ?? []).length + (mine ?? []).length).toBeGreaterThan(0);
  });
  it('documenti: visibilità per ruolo e flag', async () => {
    const t = (await owner1.from('documents').select('title')).data!.map((d) => d.title);
    expect(t.some((x) => x.startsWith('Internal staff checklist'))).toBe(false);
    expect(t).toContain('Building insurance policy TLV-01');
    const tt = (await tenant1.from('documents').select('title')).data!.map((d) => d.title);
    expect(tt).toEqual(['Lease agreement TLV-01 (demo)']);
  });
  it('audit log: append-only, il proprietario vede solo le proprie azioni', async () => {
    const ins = await staff.from('audit_log').insert({ action: 'fake', entity: 'x' });
    expect(ins.error).not.toBeNull();
    const upd = await admin.from('audit_log').update({ action: 'tampered' }).gte('id', 0).select('id');
    expect(upd.data ?? []).toHaveLength(0);
    const { data: { user } } = await owner1.auth.getUser();
    const { data } = await owner1.from('audit_log').select('actor_id');
    expect((data ?? []).every((r) => r.actor_id === user!.id)).toBe(true);
  });
  it('un utente non può cambiarsi ruolo', async () => {
    const { data: { user } } = await tenant1.auth.getUser();
    await tenant1.from('profiles').update({ role: 'admin' }).eq('id', user!.id);
    const { data } = await service().from('profiles').select('role').eq('id', user!.id).single();
    expect(data!.role).toBe('tenant');
  });
});

describe('manutenzione e preventivi', () => {
  it("l'inquilino non può aprire richieste su immobili non suoi", async () => {
    const { data: p } = await staff.from('properties').select('id').eq('code', 'TLV-02').single();
    const { data: me } = await tenant1.from('tenants').select('id').single();
    const r = await tenant1.from('maintenance_requests').insert({ property_id: p!.id, tenant_id: me!.id, title: 'x', description: 'y', priority: 'routine' });
    expect(r.error).not.toBeNull();
  });
  it("l'inquilino vede solo le proprie richieste; il proprietario solo quelle dei suoi immobili", async () => {
    const t1 = (await tenant1.from('maintenance_requests').select('property:properties(code)')).data!;
    expect(new Set(t1.map((r: any) => r.property.code))).toEqual(new Set(['TLV-01']));
    const o2 = (await owner2.from('maintenance_requests').select('property:properties(code)')).data!;
    expect(o2.every((r: any) => ['HFA-01', 'NTN-01'].includes(r.property.code))).toBe(true);
  });
  it('il proprietario non può modificare direttamente i preventivi; decide solo i propri via RPC', async () => {
    const { data: q } = await owner1.from('quotes').select('id, status').eq('status', 'pending').limit(1).single();
    expect(q).toBeTruthy();
    const upd = await owner1.from('quotes').update({ status: 'approved' }).eq('id', q!.id).select('id');
    expect(upd.data ?? []).toHaveLength(0);
    const other = await owner2.rpc('decide_quote', { p_quote: q!.id, p_decision: 'approve', p_note: null });
    expect(other.error).not.toBeNull();
    expect(other.error!.code).not.toBe('PGRST202'); // la funzione esiste: è il controllo di proprietà a negare
    const { data: still } = await staff.from('quotes').select('status').eq('id', q!.id).single();
    expect(still!.status).toBe('pending');
  });
  it('auto-approvazione sotto la soglia del proprietario (Marco: 800 ILS, attiva)', async () => {
    const { data: hfa } = await staff.from('properties').select('id').eq('code', 'HFA-01').single();
    const { data: req } = await staff.from('maintenance_requests').insert({ property_id: hfa!.id, title: 'Test auto-approval', description: 'test', priority: 'routine' }).select().single();
    const small = await staff.from('quotes').insert({ request_id: req!.id, supplier: 'S', items: [], total_ils: 500 }).select('id').single();
    const { data: q1 } = await staff.from('quotes').select('status, decision_note').eq('id', small.data!.id).single();
    expect(q1!.status).toBe('approved');
    const big = await staff.from('quotes').insert({ request_id: req!.id, supplier: 'S', items: [], total_ils: 5000 }).select('id').single();
    const { data: q2 } = await staff.from('quotes').select('status').eq('id', big.data!.id).single();
    expect(q2!.status).toBe('pending');
    // decisione con un clic sul preventivo sopra soglia
    const d = await owner2.rpc('decide_quote', { p_quote: big.data!.id, p_decision: 'reject', p_note: 'too expensive' });
    expect(d.error).toBeNull();
    const again = await owner2.rpc('decide_quote', { p_quote: big.data!.id, p_decision: 'approve', p_note: null });
    expect(again.error).not.toBeNull();
    await service().from('maintenance_requests').delete().eq('id', req!.id);
  });
  it('soglia di approvazione: solo il proprietario la imposta, con limiti', async () => {
    expect((await owner1.rpc('set_approval_settings', { p_limit: 1500, p_auto: false })).error).toBeNull();
    expect((await owner1.rpc('set_approval_settings', { p_limit: -1, p_auto: true })).error).not.toBeNull();
    expect((await tenant1.rpc('set_approval_settings', { p_limit: 100, p_auto: true })).error).not.toBeNull();
  });
  it('tempi SLA: prima risposta e risoluzione registrate automaticamente', async () => {
    const { data: p } = await staff.from('properties').select('id').eq('code', 'TLV-02').single();
    const { data: r } = await staff.from('maintenance_requests').insert({ property_id: p!.id, title: 'SLA test', description: 't', priority: 'urgent' }).select().single();
    expect(r!.first_response_at).toBeNull();
    await staff.from('maintenance_requests').update({ status: 'in_review' }).eq('id', r!.id);
    await staff.from('maintenance_requests').update({ status: 'closed' }).eq('id', r!.id);
    const { data: s } = await staff.from('maintenance_sla').select('response_hours, resolution_hours, first_response_at, resolved_at').eq('id', r!.id).single();
    expect(s!.first_response_at).not.toBeNull();
    expect(s!.resolved_at).not.toBeNull();
    expect(Number(s!.resolution_hours)).toBeGreaterThanOrEqual(0);
    await service().from('maintenance_requests').delete().eq('id', r!.id);
  });
  it('statistiche SLA aggregate: solo aggregati, nessun identificativo', async () => {
    const { data, error } = await owner1.rpc('portfolio_sla_stats', { p_months: 12 });
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(Object.keys(data![0]).sort()).toEqual(['median_resolution_hours', 'median_response_hours', 'month', 'p90_resolution_hours', 'requests']);
    expect(data!.every((r: any) => r.requests >= 5)).toBe(true);
    expect((await anon().rpc('portfolio_sla_stats', { p_months: 12 })).error).not.toBeNull();
  });
  it('il job promemoria non è invocabile dagli utenti', async () => {
    expect((await staff.rpc('run_expiry_reminders', { p_lease_days: 90 })).error).not.toBeNull();
    expect((await service().rpc('run_expiry_reminders', { p_lease_days: 90 })).error).toBeNull();
  });
});

describe('storage privato', () => {
  it("l'inquilino non scarica foto/video di altri immobili; il proprietario sì per i suoi", async () => {
    const { data: media } = await staff.from('maintenance_photos').select('storage_path, request:maintenance_requests(property:properties(code))');
    const other = media!.find((m: any) => m.request.property.code === 'HFA-01')!;
    const mine = media!.find((m: any) => m.request.property.code === 'TLV-01')!;
    expect((await tenant1.storage.from('maintenance-photos').download(other.storage_path)).error).not.toBeNull();
    expect((await tenant1.storage.from('maintenance-photos').download(mine.storage_path)).error).toBeNull();
    expect((await owner1.storage.from('maintenance-photos').download(mine.storage_path)).error).toBeNull();
    expect((await owner1.storage.from('maintenance-photos').download(other.storage_path)).error).not.toBeNull();
  });
  it('documento interno non scaricabile dal proprietario', async () => {
    const { data: d } = await staff.from('documents').select('storage_path').like('title', 'Internal staff checklist%').single();
    expect((await owner1.storage.from('documents').download(d!.storage_path)).error).not.toBeNull();
    expect((await staff.storage.from('documents').download(d!.storage_path)).error).toBeNull();
  });
  it('bucket privati: nessun accesso anonimo', async () => {
    const { data } = await anon().storage.from('documents').list('', { limit: 5 });
    expect(data ?? []).toHaveLength(0);
  });
});
