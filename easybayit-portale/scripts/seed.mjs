// =============================================================================
// Seed dei dati DEMO (tutti FITTIZI: nomi "Demo/Prova/Example", email su domini .test riservati).
// Uso: npm run db:reset   (oppure, su DB vuoto: npm run seed)
// Crea utenti per ogni ruolo, abilita la 2FA TOTP per admin/staff (obbligatoria) e per un proprietario,
// e scrive le credenziali di prova in LOCAL-CREDENTIALS.md e .local-credentials.json (gitignored).
// NON eseguire contro un progetto di produzione.
// =============================================================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import PDFDocument from 'pdfkit';
import { env } from './lib/env.mjs';
import { totp } from './lib/totp.mjs';

if (!/127\.0\.0\.1|localhost/.test(env.url) && process.env.ALLOW_REMOTE_SEED !== '1') {
  console.error('Rifiuto di eseguire il seed su un URL non locale. Impostare ALLOW_REMOTE_SEED=1 solo per staging.');
  process.exit(1);
}
const admin = createClient(env.url, env.service, { auth: { persistSession: false, autoRefreshToken: false } });
const anonClient = () => createClient(env.url, env.anon, { auth: { persistSession: false, autoRefreshToken: false } });
const fixtures = new URL('./fixtures/', import.meta.url);
const must = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

// ---------- 0. Pulizia (idempotente) ----------
console.log('• pulizia dati precedenti');
for (const t of ['inspections', 'payments', 'statement_lines', 'statements', 'quotes', 'maintenance_photos', 'maintenance_events', 'maintenance_requests', 'documents', 'leases', 'properties', 'tenants', 'owners', 'notifications', 'email_outbox', 'fx_rates']) {
  must(await admin.from(t).delete().not('created_at', 'is', null).select('id').limit(1).then((r) => (t === 'fx_rates' ? { error: null } : r)), `delete ${t}`);
}
await admin.from('fx_rates').delete().gte('rate_date', '1900-01-01');
for (const b of ['documents', 'maintenance-photos', 'inspection-photos']) {
  const { data: dirs } = await admin.storage.from(b).list('', { limit: 1000 });
  for (const d of dirs ?? []) {
    const { data: files } = await admin.storage.from(b).list(d.name, { limit: 1000 });
    if (files?.length) await admin.storage.from(b).remove(files.map((f) => `${d.name}/${f.name}`));
  }
}
const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
for (const u of existing?.users ?? []) if (/@(easybayit|example)\.test$/.test(u.email ?? '')) await admin.auth.admin.deleteUser(u.id);

// ---------- 1. Utenti di prova ----------
console.log('• utenti');
const people = [
  { key: 'admin', email: 'admin@easybayit.test', password: 'Demo-Admin-2026', role: 'admin', name: 'Avi Admin (demo)', locale: 'en', mfa: true },
  { key: 'staff', email: 'staff@easybayit.test', password: 'Demo-Staff-2026', role: 'staff', name: 'Noa Staff (demo)', locale: 'he', mfa: true },
  { key: 'owner1', email: 'owner1@example.test', password: 'Demo-Owner1-2026', role: 'owner', name: 'Dana Demo-Levi', locale: 'en', mfa: false },
  { key: 'owner2', email: 'owner2@example.test', password: 'Demo-Owner2-2026', role: 'owner', name: 'Marco Prova', locale: 'it', mfa: true },
  { key: 'tenant1', email: 'tenant1@example.test', password: 'Demo-Tenant1-2026', role: 'tenant', name: 'Tenant Alpha (demo)', locale: 'en', mfa: false },
  { key: 'tenant2', email: 'tenant2@example.test', password: 'Demo-Tenant2-2026', role: 'tenant', name: 'Tenant Beta (demo)', locale: 'fr', mfa: false },
  { key: 'tenant3', email: 'tenant3@example.test', password: 'Demo-Tenant3-2026', role: 'tenant', name: 'Tenant Gamma (demo)', locale: 'he', mfa: false },
];
const U = {};
for (const p of people) {
  const { user } = must(await admin.auth.admin.createUser({
    email: p.email, password: p.password, email_confirm: true,
    app_metadata: { role: p.role }, user_metadata: { full_name: p.name, locale: p.locale },
  }), `createUser ${p.email}`);
  must(await admin.from('profiles').update({ role: p.role, full_name: p.name, locale: p.locale }).eq('id', user.id), 'profile');
  U[p.key] = { ...p, id: user.id };
}
// 2FA TOTP via API reale di Supabase Auth (enroll + verify)
for (const p of Object.values(U).filter((x) => x.mfa)) {
  const c = anonClient();
  must(await c.auth.signInWithPassword({ email: p.email, password: p.password }), `login ${p.email}`);
  const f = must(await c.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Seed authenticator', issuer: 'Easybayit (local)' }), 'enroll');
  must(await c.auth.mfa.challengeAndVerify({ factorId: f.id, code: totp(f.totp.secret) }), 'verify');
  p.totpSecret = f.totp.secret;
  await c.auth.signOut();
}

// ---------- 2. Anagrafiche ----------
console.log('• anagrafiche');
const ins = async (table, rows) => must(await admin.from(table).insert(rows, { defaultToNull: false }).select(), `insert ${table}`);
const [o1, o2, o3] = await ins('owners', [
  { full_name: 'Dana Demo-Levi', email: 'owner1@example.test', phone: '+33 1 00 00 00 01', country: 'France', approval_limit_ils: 1500, profile_id: U.owner1.id },
  { full_name: 'Marco Prova', email: 'owner2@example.test', phone: '+39 02 0000 0002', country: 'Italia', approval_limit_ils: 800, auto_approve_below_limit: true, profile_id: U.owner2.id },
  { full_name: 'Sarah Example', email: 'owner3@example.test', phone: '+44 20 0000 0003', country: 'United Kingdom', approval_limit_ils: 2000 },
]);
const [t1, t2, t3, t4, t5] = await ins('tenants', [
  { full_name: 'Tenant Alpha (demo)', email: 'tenant1@example.test', phone: '+972 50-000-0001', profile_id: U.tenant1.id },
  { full_name: 'Tenant Beta (demo)', email: 'tenant2@example.test', phone: '+972 50-000-0002', profile_id: U.tenant2.id },
  { full_name: 'Tenant Gamma (demo)', email: 'tenant3@example.test', phone: '+972 50-000-0003', profile_id: U.tenant3.id },
  { full_name: 'Tenant Delta (demo)', email: 'tenant4@example.test', phone: '+972 50-000-0004' },
  { full_name: 'Tenant Epsilon (demo)', email: 'tenant5@example.test', phone: '+972 50-000-0005' },
]);
const props = await ins('properties', [
  { code: 'TLV-01', owner_id: o1.id, name: 'Demo Residence A', address: '1 Example Blvd, apt 4', city: 'Tel Aviv-Yafo', rooms: 3, size_sqm: 78, status: 'occupied' },
  { code: 'TLV-02', owner_id: o1.id, name: 'Sample Loft B', address: '22 Demo St., apt 9', city: 'Tel Aviv-Yafo', rooms: 2, size_sqm: 55, status: 'occupied' },
  { code: 'JLM-01', owner_id: o1.id, name: 'Example Flat C', address: '5 Fiction Rd.', city: 'Jerusalem', rooms: 4, size_sqm: 96, status: 'vacant', asking_rent_ils: 7800 },
  { code: 'HFA-01', owner_id: o2.id, name: 'Test House D', address: '8 Prova Ave.', city: 'Haifa', rooms: 4, size_sqm: 110, status: 'occupied' },
  { code: 'NTN-01', owner_id: o2.id, name: 'Prova Apartment E', address: '3 Sample Beach Rd.', city: 'Netanya', rooms: 3, size_sqm: 82, status: 'occupied' },
  { code: 'RAA-01', owner_id: o3.id, name: 'Fictional Villa F', address: '12 Example Lane', city: "Ra'anana", rooms: 5, size_sqm: 160, status: 'occupied' },
]);
const P = Object.fromEntries(props.map((p) => [p.code, p]));
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n, base = today) => new Date(base.getTime() + n * 86400000);
const leases = await ins('leases', [
  { property_id: P['TLV-01'].id, tenant_id: t1.id, start_date: '2025-03-01', end_date: iso(addDays(75)), monthly_rent_ils: 7200, deposit_ils: 21600, payment_day: 1, status: 'active' },
  { property_id: P['TLV-02'].id, tenant_id: t3.id, start_date: '2025-09-01', end_date: '2027-08-31', monthly_rent_ils: 6100, deposit_ils: 12200, payment_day: 5, status: 'active' },
  { property_id: P['HFA-01'].id, tenant_id: t2.id, start_date: '2024-11-01', end_date: '2027-10-31', monthly_rent_ils: 6800, deposit_ils: 20400, payment_day: 1, status: 'active' },
  { property_id: P['NTN-01'].id, tenant_id: t4.id, start_date: '2025-06-01', end_date: '2026-11-30', monthly_rent_ils: 5900, deposit_ils: 11800, payment_day: 10, status: 'active' },
  { property_id: P['RAA-01'].id, tenant_id: t5.id, start_date: '2025-01-01', end_date: '2026-12-31', monthly_rent_ils: 11500, deposit_ils: 34500, payment_day: 1, status: 'active' },
  { property_id: P['JLM-01'].id, tenant_id: t4.id, start_date: '2023-09-01', end_date: '2025-08-31', monthly_rent_ils: 7400, deposit_ils: 14800, payment_day: 1, status: 'ended' },
]);

// ---------- 3. Rendiconti (12 mesi pubblicati) e pagamenti ----------
console.log('• rendiconti e pagamenti');
const ym = (offset) => { const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1)); return iso(d).slice(0, 7); };
const ownersProps = { [o1.id]: ['TLV-01', 'TLV-02', 'JLM-01'], [o2.id]: ['HFA-01', 'NTN-01'], [o3.id]: ['RAA-01'] };
const leaseOf = (code) => leases.find((l) => l.property_id === P[code].id && l.status === 'active');
const rnd = (seed) => { let x = seed; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };
const r = rnd(42);
const pays = [];
let lastStatementO1;
for (const owner of [o1, o2, o3]) {
  for (let k = -12; k <= -1; k++) {
    const m = ym(k);
    const [st] = await ins('statements', [{ owner_id: owner.id, period: `${m}-01`, status: k === -1 && owner === o1 ? 'draft' : 'published', created_by: U.staff.id }]);
    if (k === -1 && owner === o1) lastStatementO1 = st;
    const lines = [];
    for (const code of ownersProps[owner.id]) {
      const l = leaseOf(code);
      const pid = P[code].id;
      if (l && `${m}-01` >= l.start_date) {
        const day = String(l.payment_day).padStart(2, '0');
        lines.push({ property_id: pid, line_date: `${m}-${day}`, category: 'rent', amount_ils: Number(l.monthly_rent_ils) });
        lines.push({ property_id: pid, line_date: `${m}-${day}`, category: 'management_fee', description: '8%', amount_ils: -Math.round(Number(l.monthly_rent_ils) * 8) / 100 });
        pays.push({ property_id: pid, lease_id: l.id, tenant_id: l.tenant_id, kind: 'rent', paid_on: `${m}-${String(Math.min(28, l.payment_day + (r() < 0.12 ? 9 : 1))).padStart(2, '0')}`, period: `${m}-01`, amount_ils: Number(l.monthly_rent_ils), method: r() < 0.6 ? 'bank_transfer' : 'standing_order', status: r() < 0.12 ? 'late' : 'paid', reference: `TRX-${m.replace('-', '')}-${code}`, source: 'manual', created_by: U.staff.id });
      } else {
        lines.push({ property_id: pid, line_date: `${m}-15`, category: 'arnona', description: 'Vacant unit', amount_ils: -480 });
      }
      lines.push({ property_id: pid, line_date: `${m}-10`, category: 'building_fee', amount_ils: -(250 + Math.round(r() * 3) * 50) });
      if (r() < 0.22) lines.push({ property_id: pid, line_date: `${m}-18`, category: 'repair', description: ['Plumber call-out', 'Electrician', 'Door lock', 'AC service'][Math.floor(r() * 4)], amount_ils: -(300 + Math.round(r() * 20) * 50) });
      if (Number(m.slice(5)) % 3 === 1) lines.push({ property_id: pid, line_date: `${m}-20`, category: 'insurance', amount_ils: -390 });
    }
    must(await admin.from('statement_lines').insert(lines.map((x) => ({ description: '', ...x, statement_id: st.id })), { defaultToNull: false }), 'lines');
  }
}
// mese corrente: alcuni affitti incassati, altri in attesa
for (const code of ['TLV-01', 'TLV-02', 'HFA-01', 'NTN-01', 'RAA-01']) {
  const l = leaseOf(code);
  const m = ym(0);
  const paid = code !== 'NTN-01';
  pays.push({ property_id: P[code].id, lease_id: l.id, tenant_id: l.tenant_id, kind: 'rent', paid_on: paid ? `${m}-01` : `${m}-${String(l.payment_day).padStart(2, '0')}`, period: `${m}-01`, amount_ils: Number(l.monthly_rent_ils), method: 'bank_transfer', status: paid ? 'paid' : 'pending', reference: paid ? `TRX-${m.replace('-', '')}-${code}` : null, source: 'csv', created_by: U.staff.id });
}
pays.push({ property_id: P['TLV-01'].id, lease_id: leaseOf('TLV-01').id, tenant_id: t1.id, kind: 'deposit', paid_on: '2025-02-20', amount_ils: 21600, method: 'bank_transfer', status: 'paid', reference: 'DEP-TLV-01', source: 'manual', created_by: U.staff.id });
must(await admin.from('payments').insert(pays, { defaultToNull: false }), 'payments');

// ---------- 4. Storico manutenzioni (per le metriche SLA) ----------
console.log('• storico manutenzioni');
const histTitles = ['Dripping shower head', 'Window handle broken', 'Electric socket not working', 'Mould in bathroom', 'Fridge noisy', 'Blocked sink', 'Intercom not working', 'Shutter stuck'];
const hist = [];
for (let k = 11; k >= 1; k--) {
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const code = ['TLV-01', 'TLV-02', 'HFA-01', 'NTN-01', 'RAA-01'][Math.floor(r() * 5)];
    const l = leaseOf(code);
    const created = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - k, 2 + Math.floor(r() * 24), 7 + Math.floor(r() * 10)));
    const urgent = r() < 0.25;
    const respH = urgent ? 0.5 + r() * 3 : 2 + r() * 20;
    const resoH = urgent ? 6 + r() * 30 : 24 + r() * 140;
    hist.push({ property_id: P[code].id, tenant_id: l.tenant_id, title: histTitles[Math.floor(r() * histTitles.length)], description: 'Historical demo request.', priority: urgent ? 'urgent' : 'routine', status: 'closed',
      created_at: created.toISOString(), first_response_at: new Date(created.getTime() + respH * 3600000).toISOString(), resolved_at: new Date(created.getTime() + resoH * 3600000).toISOString() });
  }
}
const histRows = await ins('maintenance_requests', hist);
// timeline coerente con le date storiche
for (const h of histRows) {
  await admin.from('maintenance_events').update({ created_at: h.created_at }).eq('request_id', h.id);
  await admin.from('maintenance_events').insert([
    { request_id: h.id, status: 'in_review', created_at: h.first_response_at },
    { request_id: h.id, status: 'closed', created_at: h.resolved_at },
  ]);
}

// ---------- 5. Documenti (PDF fittizi generati al volo) ----------
console.log('• documenti');
const pdf = (title, lines) => new Promise((res) => {
  const d = new PDFDocument({ size: 'A4', margin: 56 }); const ch = [];
  d.on('data', (c) => ch.push(c)); d.on('end', () => res(Buffer.concat(ch)));
  d.fontSize(9).fillColor('#b91c1c').text('FICTIONAL DEMO DOCUMENT – NOT A REAL CONTRACT', { align: 'center' }).moveDown();
  d.fillColor('#0b1324').fontSize(18).text(title).moveDown();
  d.fontSize(11); for (const l of lines) d.text(l).moveDown(0.4);
  d.end();
});
const docs = [
  { title: 'Lease agreement TLV-01 (demo)', category: 'lease', property_id: P['TLV-01'].id, lease_id: leaseOf('TLV-01').id, tenant_id: t1.id, visible_to_owner: true, visible_to_tenant: true },
  { title: 'Building insurance policy TLV-01', category: 'insurance', property_id: P['TLV-01'].id, owner_id: o1.id, visible_to_owner: true, expires_on: iso(addDays(25)) },
  { title: 'Gas safety check TLV-02', category: 'gas_safety', property_id: P['TLV-02'].id, visible_to_owner: true, visible_to_tenant: true, tenant_id: t3.id, expires_on: iso(addDays(-6)) },
  { title: 'Water heater service HFA-01', category: 'boiler_service', property_id: P['HFA-01'].id, visible_to_owner: true, expires_on: iso(addDays(40)), remind_days: 45 },
  { title: 'Lease agreement HFA-01 (demo)', category: 'lease', property_id: P['HFA-01'].id, lease_id: leaseOf('HFA-01').id, tenant_id: t2.id, visible_to_owner: true, visible_to_tenant: true },
  { title: 'Plumber invoice #2026-114 (demo)', category: 'invoice', property_id: P['TLV-01'].id, visible_to_owner: true },
  { title: 'Internal staff checklist (not visible to clients)', category: 'report', property_id: P['TLV-01'].id, visible_to_owner: false, visible_to_tenant: false },
];
for (const d of docs) {
  const bytes = await pdf(d.title, ['Easy Bayit Property Management Ltd (demo data)', `Property: ${Object.values(P).find((p) => p.id === d.property_id)?.code}`, `Generated: ${iso(today)}`]);
  const path = `${d.property_id ?? 'general'}/${randomUUID()}.pdf`;
  must(await admin.storage.from('documents').upload(path, bytes, { contentType: 'application/pdf' }), 'upload doc');
  must(await admin.from('documents').insert({ ...d, storage_path: path, mime_type: 'application/pdf', size_bytes: bytes.length, uploaded_by: U.staff.id }), 'doc');
}

// ---------- 6. Pulizia notifiche/audit dello storico, poi scenario "vivo" ----------
await admin.from('notifications').delete().not('id', 'is', null);
await admin.from('email_outbox').delete().not('id', 'is', null);
await admin.from('audit_log').delete().gte('id', 0);

console.log('• scenario attuale (preventivi, foto, video)');
const signIn = async (who) => {
  const c = anonClient();
  must(await c.auth.signInWithPassword({ email: who.email, password: who.password }), `login ${who.email}`);
  if (who.totpSecret) {
    const { data: f } = await c.auth.mfa.listFactors();
    must(await c.auth.mfa.challengeAndVerify({ factorId: f.totp[0].id, code: totp(who.totpSecret) }), 'mfa');
  }
  return c;
};
const staffC = await signIn(U.staff);
const tenant1C = await signIn(U.tenant1);
const tenant2C = await signIn(U.tenant2);
const uploadMedia = async (c, reqId, userId, file, mime) => {
  const path = `${reqId}/${randomUUID()}.${file.split('.').pop()}`;
  const bytes = readFileSync(new URL(file, fixtures));
  // lo storage non accetta scritture con la sessione dell'utente (solo URL firmati / service role): file caricato
  // con la service key, collegamento alla richiesta con il client dell'utente (RLS)
  must(await admin.storage.from('maintenance-photos').upload(path, bytes, { contentType: mime }), `upload ${file}`);
  must(await c.from('maintenance_photos').insert({ request_id: reqId, storage_path: path, mime_type: mime, size_bytes: bytes.length, uploaded_by: userId }), 'photo row');
};
// a) Tenant Alpha: scaldabagno guasto (urgente) -> preventivo sopra soglia -> attende Dana
const reqA = must(await tenant1C.from('maintenance_requests').insert({ property_id: P['TLV-01'].id, tenant_id: t1.id, created_by: U.tenant1.id, title: 'Water heater not working', description: 'No hot water since this morning. The boiler display shows error E4. Video of the leak attached.', priority: 'urgent' }).select().single(), 'reqA');
await uploadMedia(tenant1C, reqA.id, U.tenant1.id, 'heater-1.png', 'image/png');
await uploadMedia(tenant1C, reqA.id, U.tenant1.id, 'demo-leak.mp4', 'video/mp4');
must(await staffC.from('maintenance_requests').update({ status: 'in_review' }).eq('id', reqA.id), 'reqA review');
must(await staffC.from('maintenance_events').insert({ request_id: reqA.id, note: 'Technician inspected: heating element must be replaced.', actor_id: U.staff.id }), 'note');
must(await staffC.from('quotes').insert({ request_id: reqA.id, supplier: 'Demo Plumbing Ltd (fictional)', items: [{ label: 'Labour', amount: 650 }, { label: 'Heating element + thermostat', amount: 1450 }, { label: 'VAT 18%', amount: 378 }], total_ils: 2478, created_by: U.staff.id }), 'quote A');
// b) Tenant Beta: rubinetto che perde -> preventivo entro soglia di Marco (auto-approvazione)
const reqB = must(await tenant2C.from('maintenance_requests').insert({ property_id: P['HFA-01'].id, tenant_id: t2.id, created_by: U.tenant2.id, title: 'Kitchen tap leaking', description: 'Constant drip under the sink.', priority: 'routine' }).select().single(), 'reqB');
await uploadMedia(tenant2C, reqB.id, U.tenant2.id, 'tap-1.jpg', 'image/jpeg');
must(await staffC.from('maintenance_requests').update({ status: 'in_review' }).eq('id', reqB.id), 'reqB review');
must(await staffC.from('quotes').insert({ request_id: reqB.id, supplier: 'Example Handyman (fictional)', items: [{ label: 'Labour', amount: 280 }, { label: 'Cartridge', amount: 120 }], total_ils: 400, created_by: U.staff.id }), 'quote B');
// c) richiesta programmata su TLV-02 (aperta dallo staff)
const reqC = must(await staffC.from('maintenance_requests').insert({ property_id: P['TLV-02'].id, tenant_id: t3.id, created_by: U.staff.id, title: 'Air conditioner noisy', description: 'Annual AC service, noise reported by tenant.', priority: 'routine' }).select().single(), 'reqC');
must(await staffC.from('maintenance_requests').update({ status: 'scheduled', scheduled_for: iso(addDays(3)) }).eq('id', reqC.id), 'reqC sched');
// d) pubblicazione del rendiconto del mese scorso di Dana (genera notifica + email)
must(await staffC.from('statements').update({ status: 'published' }).eq('id', lastStatementO1.id), 'publish');
// e) promemoria scadenze (assicurazione, controllo gas scaduto, fine contratto TLV-01 entro 90 giorni)
must(await admin.rpc('run_expiry_reminders', { p_lease_days: 90 }), 'reminders');
// f) ispezione annuale completata su TLV-01 (foto illustrative con filigrana EXAMPLE, dati fittizi)
//    + presa visione dell'inquilino; il proprietario non ha ancora confermato. Bozza di ispezione d'uscita.
const insp = must(await staffC.from('inspections').insert({ property_id: P['TLV-01'].id, lease_id: leaseOf('TLV-01').id, kind: 'annual', performed_at: '2026-03-31', performed_by: U.staff.id, created_by: U.staff.id,
  summary: 'Apartment in good overall condition. Bathroom silicone to be redone (small mould spots). Heater ageing: replacement to plan within 12 months.' }).select().single(), 'inspection');
const inspItems = [
  ['Living room', 'Walls and ceiling', 'good', ''], ['Living room', 'Floor', 'good', 'Light wear near the balcony door'], ['Living room', 'Windows and shutters', 'fair', 'Left shutter strap frayed'],
  ['Kitchen', 'Cabinets and worktop', 'good', ''], ['Kitchen', 'Sink and tap', 'good', ''], ['Kitchen', 'Oven and hob', 'fair', 'One burner ignites slowly'],
  ['Bathroom', 'Shower and silicone', 'poor', 'Mould spots on silicone: redo'], ['Bathroom', 'Toilet and basin', 'good', ''],
  ['Bedroom', 'Walls and wardrobe', 'good', ''], ['Balcony', 'Railing and drain', 'good', ''],
  ['Utilities', 'Water / electricity meters', 'good', 'Readings photographed'], ['Utilities', 'Water heater (dud shemesh)', 'fair', 'Approx. 11 years old'],
].map(([room, item, condition, note], i) => ({ inspection_id: insp.id, room, item, condition, note, position: i + 1 }));
const items = must(await staffC.from('inspection_items').insert(inspItems).select(), 'inspection items');
const itemId = (room) => items.find((i) => i.room === room)?.id ?? null;
const inspPhotos = [
  ['insp-living.jpg', 'Living room', '2026-03-31T10:04:00+03:00'], ['insp-kitchen.jpg', 'Kitchen', '2026-03-31T10:11:00+03:00'], ['insp-bathroom.jpg', 'Bathroom', '2026-03-31T10:18:00+03:00'],
  ['insp-bedroom.jpg', 'Bedroom', '2026-03-31T10:25:00+03:00'], ['insp-balcony.jpg', 'Balcony', '2026-03-31T10:31:00+03:00'], ['insp-meters.jpg', 'Utilities', '2026-03-31T10:36:00+03:00'],
];
for (const [file, room, taken] of inspPhotos) {
  const bytes = readFileSync(new URL(file, fixtures));
  const path = `${insp.id}/${randomUUID()}.jpg`;
  must(await admin.storage.from('inspection-photos').upload(path, bytes, { contentType: 'image/jpeg' }), `upload ${file}`);
  must(await staffC.from('inspection_photos').insert({ inspection_id: insp.id, item_id: itemId(room), storage_path: path, mime_type: 'image/jpeg', size_bytes: bytes.length, caption: room, taken_at: taken, taken_at_source: 'manual', uploaded_by: U.staff.id, sha256: createHash('sha256').update(bytes).digest('hex') }), 'inspection photo');
}
must(await staffC.from('inspections').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', insp.id), 'complete inspection');
must(await tenant1C.rpc('acknowledge_inspection', { p_inspection: insp.id, p_comment: 'Agree. Please schedule the bathroom silicone.' }), 'ack tenant');
const draft = must(await staffC.from('inspections').insert({ property_id: P['TLV-01'].id, lease_id: leaseOf('TLV-01').id, kind: 'move_out', performed_at: iso(addDays(75)), performed_by: U.staff.id, created_by: U.staff.id }).select().single(), 'draft inspection');
must(await staffC.from('inspection_items').insert([
  { inspection_id: draft.id, room: 'Living room', item: 'Walls and ceiling', condition: 'good', note: '', position: 1 },
  { inspection_id: draft.id, room: 'Kitchen', item: 'Oven and hob', condition: 'fair', note: 'Check burner (noted at annual inspection)', position: 2 },
]), 'draft items');
for (const c of [staffC, tenant1C, tenant2C]) await c.auth.signOut();

// ---------- 7. Credenziali di prova (SOLO LOCALE) ----------
const creds = Object.values(U).map(({ key, email, password, role, name, totpSecret }) => ({ key, email, password, role, name, totpSecret: totpSecret ?? null }));
writeFileSync(new URL('../.local-credentials.json', import.meta.url), JSON.stringify(creds, null, 2));
writeFileSync(new URL('../LOCAL-CREDENTIALS.md', import.meta.url), [
  '# Credenziali di prova (SOLO ambiente locale, dati fittizi) – file gitignored', '',
  '| Ruolo | Email | Password | Segreto TOTP (2FA) |', '|---|---|---|---|',
  ...creds.map((c) => `| ${c.role} | ${c.email} | ${c.password} | ${c.totpSecret ?? '—'} |`), '',
  'Codice 2FA attuale: `node scripts/totp.mjs <segreto>` oppure aggiungere il segreto in un\'app di autenticazione.', '',
].join('\n'));
console.log('✓ seed completato. Credenziali in LOCAL-CREDENTIALS.md');
