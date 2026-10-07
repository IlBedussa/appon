-- =============================================================================
-- Priorità MVP da ricerca di mercato:
--  1) preventivi: foto E video, soglia di approvazione impostata dal proprietario con auto-approvazione
--  2) multi-valuta: aggiunta GBP; lingua francese (fr)
--  3) tempi misurati di risposta/riparazione (SLA) + statistiche aggregate pubblicabili
--  4) scadenze documenti (fine contratto, assicurazione, controlli gas/caldaia) con promemoria
-- =============================================================================

-- ---------- Bucket di storage creati anche da migrazione (necessario in produzione) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
  ('maintenance-photos', 'maintenance-photos', false, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------- 1) Video nelle richieste di manutenzione ----------
alter table public.maintenance_photos drop constraint maintenance_photos_mime_type_check;
alter table public.maintenance_photos drop constraint maintenance_photos_size_bytes_check;
alter table public.maintenance_photos add constraint maintenance_photos_mime_type_check
  check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'));
alter table public.maintenance_photos add constraint maintenance_photos_size_bytes_check
  check (size_bytes > 0 and size_bytes <= case when mime_type like 'video/%' then 52428800 else 8388608 end);
alter table public.maintenance_photos add column media_type text generated always as (case when mime_type like 'video/%' then 'video' else 'image' end) stored;

-- ---------- 1) Soglia di approvazione del proprietario ----------
alter table public.owners add column auto_approve_below_limit boolean not null default false;

-- Il proprietario modifica SOLO soglia e auto-approvazione (non ha UPDATE diretto su owners)
create or replace function public.set_approval_settings(p_limit numeric, p_auto boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := private.my_owner_id();
begin
  if v_owner is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_limit is null or p_limit < 0 or p_limit > 1000000 then raise exception 'invalid limit' using errcode = '22023'; end if;
  update public.owners set approval_limit_ils = round(p_limit, 2), auto_approve_below_limit = coalesce(p_auto, false) where id = v_owner;
  perform private.write_audit('owner.approval_settings', 'owners', v_owner::text, jsonb_build_object('limit_ils', round(p_limit, 2), 'auto', coalesce(p_auto, false)));
end $$;
revoke all on function public.set_approval_settings(numeric, boolean) from public, anon;
grant execute on function public.set_approval_settings(numeric, boolean) to authenticated;

-- Nuovo preventivo: se il proprietario ha attivato l'auto-approvazione e il totale è entro la soglia,
-- viene approvato automaticamente (tracciato); altrimenti attende la decisione del proprietario.
create or replace function private.quote_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_req public.maintenance_requests;
  v_owner public.owners;
begin
  select * into v_req from public.maintenance_requests where id = new.request_id;
  select o.* into v_owner from public.properties p join public.owners o on o.id = p.owner_id where p.id = v_req.property_id;
  if new.status <> 'pending' then return new; end if;
  if v_owner.auto_approve_below_limit and new.total_ils <= v_owner.approval_limit_ils then
    update public.quotes set status = 'approved', decided_at = now(), decision_note = 'auto-approved: within owner threshold' where id = new.id;
    update public.maintenance_requests set status = 'approved' where id = v_req.id and status not in ('closed', 'cancelled');
    insert into public.maintenance_events (request_id, status, note, actor_id)
      values (v_req.id, null, 'quote auto-approved (within owner threshold ' || v_owner.approval_limit_ils || ' ILS)', null);
    perform private.write_audit('quote.auto_approved', 'quotes', new.id::text, jsonb_build_object('total_ils', new.total_ils, 'limit_ils', v_owner.approval_limit_ils, 'request_ref', v_req.ref));
    perform private.notify(v_owner.profile_id, 'quote.auto_approved',
      jsonb_build_object('ref', v_req.ref, 'title', v_req.title, 'total_ils', new.total_ils), '/owner/maintenance/' || v_req.id, true);
    perform private.notify_staff('quote.decided', jsonb_build_object('ref', v_req.ref, 'decision', 'approved', 'total_ils', new.total_ils), '/admin/maintenance/' || v_req.id);
  else
    update public.maintenance_requests set status = 'quote_pending' where id = new.request_id and status not in ('closed', 'cancelled');
    perform private.notify(v_owner.profile_id, 'quote.pending',
      jsonb_build_object('ref', v_req.ref, 'title', v_req.title, 'total_ils', new.total_ils), '/owner/maintenance/' || v_req.id, true);
  end if;
  return new;
end $$;

-- ---------- 2) GBP e francese ----------
alter table public.profiles drop constraint profiles_preferred_currency_check;
alter table public.profiles add constraint profiles_preferred_currency_check check (preferred_currency in ('ILS', 'EUR', 'USD', 'GBP'));
alter table public.profiles drop constraint profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check check (locale in ('en', 'he', 'it', 'fr'));
alter table public.fx_rates drop constraint fx_rates_currency_check;
alter table public.fx_rates add constraint fx_rates_currency_check check (currency in ('USD', 'EUR', 'GBP'));
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_role public.app_role;
begin
  begin
    v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'tenant');
  exception when others then v_role := 'tenant';
  end;
  insert into public.profiles (id, role, full_name, email, locale)
  values (new.id, v_role, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 200), coalesce(new.email, ''),
    case when new.raw_user_meta_data ->> 'locale' in ('en', 'he', 'it', 'fr') then new.raw_user_meta_data ->> 'locale' else 'en' end)
  on conflict (id) do nothing;
  return new;
end $$;

-- ---------- 3) Tempi di risposta e risoluzione (SLA) ----------
alter table public.maintenance_requests add column first_response_at timestamptz;
alter table public.maintenance_requests add column resolved_at timestamptz;
create index on public.maintenance_requests (created_at);

-- Prima risposta = primo cambio di stato oltre "reported" (o prima nota dello staff); risoluzione = chiusura
create or replace function private.maint_sla_before() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if new.first_response_at is null and new.status <> 'reported' then new.first_response_at := now(); end if;
    if new.status = 'closed' and new.resolved_at is null then new.resolved_at := now(); end if;
    if old.status = 'closed' and new.status <> 'closed' then new.resolved_at := null; end if;
  end if;
  return new;
end $$;
create trigger maint_sla_before before update on public.maintenance_requests for each row execute function private.maint_sla_before();

create or replace function private.maint_event_first_response() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.note is not null and exists (select 1 from public.profiles p where p.id = new.actor_id and p.role in ('admin', 'staff')) then
    update public.maintenance_requests set first_response_at = coalesce(first_response_at, now()) where id = new.request_id and first_response_at is null;
  end if;
  return new;
end $$;
create trigger maint_event_first_response after insert on public.maintenance_events for each row execute function private.maint_event_first_response();

-- Vista per richiesta (security_invoker: rispetta la RLS di chi interroga)
create view public.maintenance_sla with (security_invoker = true) as
select r.id, r.ref, r.property_id, r.priority, r.status, r.created_at, r.first_response_at, r.resolved_at,
  round(extract(epoch from (r.first_response_at - r.created_at)) / 3600.0, 2) as response_hours,
  round(extract(epoch from (r.resolved_at - r.created_at)) / 3600.0, 2) as resolution_hours
from public.maintenance_requests r;
grant select on public.maintenance_sla to authenticated;
revoke all on public.maintenance_sla from anon;

-- Statistiche AGGREGATE dell'intero portafoglio (nessun dato personale, mese con almeno 5 richieste):
-- pensate per il widget del proprietario (confronto) e per una futura pubblicazione sul sito.
create or replace function public.portfolio_sla_stats(p_months integer default 12)
returns table (month date, requests bigint, median_response_hours numeric, median_resolution_hours numeric, p90_resolution_hours numeric)
language sql stable security definer set search_path = '' as $$
  select date_trunc('month', r.created_at)::date as month,
         count(*) as requests,
         round((percentile_cont(0.5) within group (order by extract(epoch from (r.first_response_at - r.created_at)) / 3600.0))::numeric, 1),
         round((percentile_cont(0.5) within group (order by extract(epoch from (r.resolved_at - r.created_at)) / 3600.0))::numeric, 1),
         round((percentile_cont(0.9) within group (order by extract(epoch from (r.resolved_at - r.created_at)) / 3600.0))::numeric, 1)
  from public.maintenance_requests r
  where r.created_at >= date_trunc('month', now()) - make_interval(months => greatest(1, least(p_months, 36)) - 1)
    and r.status <> 'cancelled'
  group by 1
  having count(*) >= 5
  order by 1
$$;
revoke all on function public.portfolio_sla_stats(integer) from public, anon;
grant execute on function public.portfolio_sla_stats(integer) to authenticated, service_role;

-- ---------- 4) Scadenze e promemoria ----------
alter type public.doc_category add value if not exists 'gas_safety';
alter type public.doc_category add value if not exists 'boiler_service';
alter table public.documents add column expires_on date;
alter table public.documents add column remind_days smallint not null default 30 check (remind_days between 1 and 365);
alter table public.documents add column reminded_at timestamptz;
create index on public.documents (expires_on) where expires_on is not null;
alter table public.leases add column end_reminded_at timestamptz;

-- cambiando la scadenza il promemoria riparte
create or replace function private.doc_expiry_reset() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.expires_on is distinct from old.expires_on or new.remind_days is distinct from old.remind_days then new.reminded_at := null; end if;
  return new;
end $$;
create trigger doc_expiry_reset before update on public.documents for each row execute function private.doc_expiry_reset();
create or replace function private.lease_end_reset() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.end_date is distinct from old.end_date then new.end_reminded_at := null; end if;
  return new;
end $$;
create trigger lease_end_reset before update on public.leases for each row execute function private.lease_end_reset();

-- Job giornaliero (Vercel Cron -> /api/cron/reminders, oppure pg_cron): notifiche + email
create or replace function public.run_expiry_reminders(p_lease_days integer default 90)
returns integer language plpgsql security definer set search_path = '' as $$
declare r record; n integer := 0; v_owner_profile uuid; v_tenant_profile uuid;
begin
  for r in
    select d.* from public.documents d
    where d.expires_on is not null and d.reminded_at is null and d.expires_on <= current_date + d.remind_days
  loop
    v_owner_profile := coalesce((select o.profile_id from public.owners o where o.id = r.owner_id), private.owner_profile_of_property(r.property_id));
    if r.visible_to_owner then
      perform private.notify(v_owner_profile, 'document.expiring', jsonb_build_object('title', r.title, 'date', r.expires_on), '/owner/documents', true);
    end if;
    perform private.notify_staff('document.expiring', jsonb_build_object('title', r.title, 'date', r.expires_on), '/admin/documents');
    update public.documents set reminded_at = now() where id = r.id;
    n := n + 1;
  end loop;
  for r in
    select l.*, p.name as property_name, p.id as pid from public.leases l join public.properties p on p.id = l.property_id
    where l.status = 'active' and l.end_reminded_at is null and l.end_date <= current_date + p_lease_days
  loop
    perform private.notify(private.owner_profile_of_property(r.pid), 'lease.ending', jsonb_build_object('title', r.property_name, 'date', r.end_date), '/owner/properties', true);
    select t.profile_id into v_tenant_profile from public.tenants t where t.id = r.tenant_id;
    perform private.notify(v_tenant_profile, 'lease.ending', jsonb_build_object('title', r.property_name, 'date', r.end_date), '/tenant', true);
    perform private.notify_staff('lease.ending', jsonb_build_object('title', r.property_name, 'date', r.end_date), '/admin/leases/' || r.id);
    update public.leases set end_reminded_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.run_expiry_reminders(integer) from public, anon, authenticated;
grant execute on function public.run_expiry_reminders(integer) to service_role;

-- funzioni private nuove: stessa politica di permessi
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
