-- =============================================================================
-- Row Level Security: i permessi per ruolo vivono NEL DATABASE.
--  * admin/staff: tutto, ma SOLO con sessione 2FA (aal2) -> 2FA obbligatoria anche lato DB
--  * owner: solo i propri immobili e i dati collegati
--  * tenant: solo il proprio contratto, le proprie richieste, documenti e pagamenti
--  * se un utente ha attivato la 2FA, senza sessione aal2 non vede nulla
-- Le funzioni di supporto sono SECURITY DEFINER (evitano ricorsioni RLS) con search_path vuoto.
-- =============================================================================

-- ---------- Funzioni di supporto ----------
create or replace function private.jwt_aal() returns text
language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt()) ->> 'aal', 'aal1')
$$;

create or replace function private.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.is_active
$$;

-- true se la sessione rispetta la 2FA: aal2, oppure l'utente non ha fattori verificati
create or replace function private.mfa_ok() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.jwt_aal() = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status = 'verified')
$$;

create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_app_role() in ('admin', 'staff'), false) and private.jwt_aal() = 'aal2'
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_app_role() = 'admin', false) and private.jwt_aal() = 'aal2'
$$;

create or replace function private.my_owner_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select o.id from public.owners o
  where o.profile_id = (select auth.uid()) and private.current_app_role() = 'owner' and private.mfa_ok()
$$;

create or replace function private.my_tenant_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select t.id from public.tenants t
  where t.profile_id = (select auth.uid()) and private.current_app_role() = 'tenant' and private.mfa_ok()
$$;

create or replace function private.owns_property(p_property uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.properties p where p.id = p_property and p.owner_id = private.my_owner_id())
$$;

-- inquilino con contratto attivo o futuro sull'immobile (serve per aprire richieste)
create or replace function private.tenant_has_current_lease(p_property uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.leases l
    where l.property_id = p_property and l.tenant_id = private.my_tenant_id() and l.status in ('active', 'upcoming')
  )
$$;

create or replace function private.tenant_any_lease(p_property uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.leases l where l.property_id = p_property and l.tenant_id = private.my_tenant_id())
$$;

create or replace function private.can_see_request(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_staff() or exists (
    select 1 from public.maintenance_requests r
    where r.id = p_request
      and (private.owns_property(r.property_id) or (r.tenant_id is not null and r.tenant_id = private.my_tenant_id()))
  )
$$;

create or replace function private.owner_can_see_request(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.maintenance_requests r where r.id = p_request and private.owns_property(r.property_id))
$$;

-- caricamento foto: staff, oppure l'inquilino che ha aperto la richiesta (cartella = id richiesta)
create or replace function private.can_upload_photo(p_folder text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.is_staff() then return true; end if;
  if p_folder !~ '^[0-9a-f-]{36}$' then return false; end if;
  return exists (
    select 1 from public.maintenance_requests r
    where r.id = p_folder::uuid and r.tenant_id = private.my_tenant_id() and r.status not in ('closed', 'cancelled')
  );
end $$;

-- ---------- Attivazione RLS su tutte le tabelle ----------
alter table public.profiles enable row level security;
alter table public.owners enable row level security;
alter table public.tenants enable row level security;
alter table public.properties enable row level security;
alter table public.leases enable row level security;
alter table public.statements enable row level security;
alter table public.statement_lines enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.maintenance_events enable row level security;
alter table public.maintenance_photos enable row level security;
alter table public.quotes enable row level security;
alter table public.documents enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.email_outbox enable row level security;
alter table public.audit_log enable row level security;
alter table public.fx_rates enable row level security;

-- Difesa in profondità: l'utente anonimo non accede a nessuna tabella
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
-- coda email e audit: nessuna scrittura diretta dai client
revoke insert, update, delete on public.email_outbox, public.audit_log, public.fx_rates from authenticated;
revoke all on private.rate_limits from anon, authenticated;

-- ---------- profiles ----------
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_staff());
-- l'utente modifica solo alcuni campi del proprio profilo (mai il ruolo)
revoke update on public.profiles from authenticated;
grant update (full_name, locale, preferred_currency) on public.profiles to authenticated;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, delete on public.profiles from authenticated;

-- ---------- owners ----------
create policy owners_select on public.owners for select to authenticated
  using (private.is_staff() or id = private.my_owner_id());
create policy owners_staff_write on public.owners for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- ---------- tenants ----------
-- il proprietario vede l'anagrafica degli inquilini dei propri immobili [DA VERIFICARE con avvocato: minimizzazione]
create policy tenants_select on public.tenants for select to authenticated
  using (
    private.is_staff() or id = private.my_tenant_id()
    or exists (select 1 from public.leases l where l.tenant_id = tenants.id and private.owns_property(l.property_id))
  );
create policy tenants_staff_write on public.tenants for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- ---------- properties ----------
create policy properties_select on public.properties for select to authenticated
  using (private.is_staff() or owner_id = private.my_owner_id() or private.tenant_any_lease(id));
create policy properties_staff_write on public.properties for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- ---------- leases ----------
create policy leases_select on public.leases for select to authenticated
  using (private.is_staff() or private.owns_property(property_id) or tenant_id = private.my_tenant_id());
create policy leases_staff_write on public.leases for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- ---------- statements (il proprietario vede solo i rendiconti PUBBLICATI) ----------
create policy statements_select on public.statements for select to authenticated
  using (private.is_staff() or (owner_id = private.my_owner_id() and status = 'published'));
create policy statements_staff_write on public.statements for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

create policy statement_lines_select on public.statement_lines for select to authenticated
  using (
    private.is_staff() or exists (
      select 1 from public.statements s
      where s.id = statement_lines.statement_id and s.owner_id = private.my_owner_id() and s.status = 'published'
    )
  );
create policy statement_lines_staff_write on public.statement_lines for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- ---------- maintenance_requests ----------
create policy maint_select on public.maintenance_requests for select to authenticated
  using (private.is_staff() or private.owns_property(property_id) or (tenant_id is not null and tenant_id = private.my_tenant_id()));
-- l'inquilino apre richieste solo per un immobile con contratto in corso, a proprio nome, in stato "reported"
create policy maint_tenant_insert on public.maintenance_requests for insert to authenticated
  with check (
    tenant_id = private.my_tenant_id() and created_by = (select auth.uid())
    and status = 'reported' and private.tenant_has_current_lease(property_id)
  );
create policy maint_staff_write on public.maintenance_requests for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

create policy maint_events_select on public.maintenance_events for select to authenticated
  using (private.can_see_request(request_id));
create policy maint_events_staff_insert on public.maintenance_events for insert to authenticated
  with check (private.is_staff());

create policy maint_photos_select on public.maintenance_photos for select to authenticated
  using (private.can_see_request(request_id));
create policy maint_photos_insert on public.maintenance_photos for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and private.can_upload_photo(request_id::text));
create policy maint_photos_staff_delete on public.maintenance_photos for delete to authenticated
  using (private.is_staff());

-- ---------- quotes: staff e proprietario (l'inquilino NON vede gli importi) ----------
create policy quotes_select on public.quotes for select to authenticated
  using (private.is_staff() or private.owner_can_see_request(request_id));
create policy quotes_staff_write on public.quotes for all to authenticated
  using (private.is_staff()) with check (private.is_staff());
-- il proprietario decide SOLO tramite la funzione public.decide_quote (tracciata)

-- ---------- documents ----------
create policy documents_select on public.documents for select to authenticated
  using (
    private.is_staff()
    or (visible_to_owner and (owner_id = private.my_owner_id() or (property_id is not null and private.owns_property(property_id))))
    or (visible_to_tenant and (
          tenant_id = private.my_tenant_id()
          or (lease_id is not null and exists (select 1 from public.leases l where l.id = documents.lease_id and l.tenant_id = private.my_tenant_id()))
       ))
  );
create policy documents_staff_write on public.documents for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- ---------- payments ----------
create policy payments_select on public.payments for select to authenticated
  using (
    private.is_staff() or private.owns_property(property_id)
    or (tenant_id = private.my_tenant_id() and kind in ('rent', 'deposit', 'other'))
  );
create policy payments_staff_write on public.payments for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- ---------- notifications: ognuno solo le proprie ----------
create policy notifications_select on public.notifications for select to authenticated
  using (profile_id = (select auth.uid()));
revoke insert, update, delete on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_mark_read on public.notifications for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- ---------- audit_log: staff vede tutto, gli altri solo le proprie azioni ----------
create policy audit_select on public.audit_log for select to authenticated
  using (private.is_staff() or actor_id = (select auth.uid()));

-- ---------- fx_rates: lettura per tutti gli autenticati ----------
create policy fx_select on public.fx_rates for select to authenticated using (true);

-- ---------- email_outbox: nessun accesso dai client (solo service role) ----------

-- =============================================================================
-- Storage: bucket privati. Il permesso di lettura di un file dipende dalla riga
-- corrispondente in public.documents / public.maintenance_photos (già filtrata da RLS).
-- =============================================================================
create policy "documents read via table" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and exists (select 1 from public.documents d where d.storage_path = storage.objects.name));
create policy "documents staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and private.is_staff());
create policy "documents staff update" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and private.is_staff());
create policy "documents staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and private.is_staff());

create policy "photos read via table" on storage.objects for select to authenticated
  using (bucket_id = 'maintenance-photos' and exists (select 1 from public.maintenance_photos ph where ph.storage_path = storage.objects.name));
create policy "photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'maintenance-photos' and private.can_upload_photo((storage.foldername(name))[1]));
create policy "photos staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'maintenance-photos' and private.is_staff());
