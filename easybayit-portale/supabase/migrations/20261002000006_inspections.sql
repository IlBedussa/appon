-- =============================================================================
-- Ispezioni fotografiche (ingresso / uscita / annuale) con conferma di presa visione.
--  * staff (sempre aal2): crea, compila, carica foto, completa
--  * proprietario: vede le ispezioni COMPLETATE dei propri immobili
--  * inquilino: vede le ispezioni COMPLETATE del proprio contratto
--    (o dell'immobile, se l'ispezione non è legata a un contratto e il suo contratto è attivo/futuro)
--  * la conferma di presa visione passa SOLO dalla funzione public.acknowledge_inspection
--  * dopo il completamento voci e foto sono immutabili (anche per lo staff); solo il service role
--    può cancellare un'ispezione completata (cancellazione dati su richiesta), mai modificarla
-- [DA CONFERMARE] valore legale della conferma: per ora è "presa visione", non accettazione dello stato.
-- =============================================================================

create type public.inspection_kind as enum ('move_in', 'move_out', 'annual');
create type public.inspection_status as enum ('draft', 'completed');
create type public.inspection_condition as enum ('good', 'fair', 'poor', 'na');

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  lease_id uuid references public.leases (id) on delete restrict,
  kind public.inspection_kind not null,
  status public.inspection_status not null default 'draft',
  performed_at date not null default current_date,
  performed_by uuid references public.profiles (id) on delete set null,
  summary text not null default '' check (char_length(summary) <= 4000),
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null))
);
create index on public.inspections (property_id);
create index on public.inspections (lease_id);
create trigger inspections_touch before update on public.inspections for each row execute function private.touch_updated_at();

create table public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  room text not null check (char_length(room) between 1 and 80),
  item text not null check (char_length(item) between 1 and 120),
  condition public.inspection_condition not null default 'good',
  note text not null default '' check (char_length(note) <= 1000),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.inspection_items (inspection_id, position);

create table public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  item_id uuid references public.inspection_items (id) on delete set null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 8388608),
  caption text not null default '' check (char_length(caption) <= 200),
  taken_at timestamptz,
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$')
);
create index on public.inspection_photos (inspection_id);

create table public.inspection_acks (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null check (role in ('owner', 'tenant')),
  acknowledged_at timestamptz not null default now(),
  comment text not null default '' check (char_length(comment) <= 1000),
  unique (inspection_id, profile_id)
);

-- ---------- Funzioni di supporto ----------
create or replace function private.can_see_inspection(p_inspection uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_staff() or exists (
    select 1 from public.inspections i
    where i.id = p_inspection and i.status = 'completed'
      and (
        private.owns_property(i.property_id)
        or (i.lease_id is not null and exists (select 1 from public.leases l where l.id = i.lease_id and l.tenant_id = private.my_tenant_id()))
        or (i.lease_id is null and private.tenant_has_current_lease(i.property_id))
      )
  )
$$;

create or replace function private.inspection_is_draft(p_inspection uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.inspections where id = p_inspection and status = 'draft')
$$;

-- ---------- RLS ----------
alter table public.inspections enable row level security;
alter table public.inspection_items enable row level security;
alter table public.inspection_photos enable row level security;
alter table public.inspection_acks enable row level security;
revoke all on public.inspections, public.inspection_items, public.inspection_photos, public.inspection_acks from anon;
-- le conferme si scrivono solo tramite funzione
revoke insert, update, delete on public.inspection_acks from authenticated;

create policy insp_select on public.inspections for select to authenticated using (private.can_see_inspection(id));
create policy insp_staff_insert on public.inspections for insert to authenticated with check (private.is_staff() and status = 'draft');
create policy insp_staff_update on public.inspections for update to authenticated using (private.is_staff() and status = 'draft') with check (private.is_staff());
create policy insp_staff_delete on public.inspections for delete to authenticated using (private.is_staff() and status = 'draft');

create policy insp_items_select on public.inspection_items for select to authenticated using (private.can_see_inspection(inspection_id));
create policy insp_items_staff_insert on public.inspection_items for insert to authenticated with check (private.is_staff() and private.inspection_is_draft(inspection_id));
create policy insp_items_staff_update on public.inspection_items for update to authenticated using (private.is_staff() and private.inspection_is_draft(inspection_id)) with check (private.is_staff() and private.inspection_is_draft(inspection_id));
create policy insp_items_staff_delete on public.inspection_items for delete to authenticated using (private.is_staff() and private.inspection_is_draft(inspection_id));

create policy insp_photos_select on public.inspection_photos for select to authenticated using (private.can_see_inspection(inspection_id));
create policy insp_photos_staff_insert on public.inspection_photos for insert to authenticated
  with check (private.is_staff() and uploaded_by = (select auth.uid()) and private.inspection_is_draft(inspection_id));
create policy insp_photos_staff_delete on public.inspection_photos for delete to authenticated using (private.is_staff() and private.inspection_is_draft(inspection_id));

create policy insp_acks_select on public.inspection_acks for select to authenticated
  using (private.is_staff() or profile_id = (select auth.uid()) or private.can_see_inspection(inspection_id));

-- ---------- Immutabilità dopo il completamento (vale anche per service role / staff) ----------
create or replace function private.inspection_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.status = 'completed' then
    raise exception 'inspection is completed and cannot be changed' using errcode = '42501';
  end if;
  -- cancellazione di un'ispezione completata: solo service role (es. cancellazione dati su richiesta / ambiente di test)
  if tg_op = 'DELETE' and old.status = 'completed' and coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'inspection is completed and cannot be deleted' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.status = 'completed' then
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return coalesce(new, old);
end $$;
create trigger inspections_guard before update or delete on public.inspections for each row execute function private.inspection_guard();

create or replace function private.inspection_child_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := coalesce(new.inspection_id, old.inspection_id);
begin
  -- la cancellazione a cascata dell'ispezione (solo bozze) passa: l'ispezione è ancora draft
  if exists (select 1 from public.inspections where id = v_id and status = 'completed') then
    raise exception 'inspection is completed: items and photos are read-only' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.inspection_id is distinct from new.inspection_id then
    raise exception 'cannot move rows between inspections' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger inspection_items_guard before insert or update or delete on public.inspection_items for each row execute function private.inspection_child_guard();
create trigger inspection_photos_guard before insert or update or delete on public.inspection_photos for each row execute function private.inspection_child_guard();

-- ---------- Conferma di presa visione ----------
create or replace function public.acknowledge_inspection(p_inspection uuid, p_comment text default '')
returns public.inspection_acks language plpgsql security definer set search_path = '' as $$
declare
  v_role public.app_role := private.current_app_role();
  v_ack public.inspection_acks;
  v_i public.inspections;
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if v_role not in ('owner', 'tenant') then raise exception 'only owners and tenants acknowledge' using errcode = '42501'; end if;
  if not private.can_see_inspection(p_inspection) then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into v_i from public.inspections where id = p_inspection;
  if v_i.status <> 'completed' then raise exception 'inspection not completed' using errcode = '22023'; end if;
  if char_length(coalesce(p_comment, '')) > 1000 then raise exception 'comment too long' using errcode = '22023'; end if;
  insert into public.inspection_acks (inspection_id, profile_id, role, comment)
  values (p_inspection, (select auth.uid()), v_role, coalesce(btrim(p_comment), ''))
  on conflict (inspection_id, profile_id) do nothing
  returning * into v_ack;
  if v_ack.id is null then
    select * into v_ack from public.inspection_acks where inspection_id = p_inspection and profile_id = (select auth.uid());
  else
    perform private.write_audit('inspection.acknowledged', 'inspections', p_inspection::text, jsonb_build_object('role', v_role, 'has_comment', v_ack.comment <> ''));
    perform private.notify_staff('inspection_acknowledged', jsonb_build_object('kind', v_i.kind, 'role', v_role), '/admin/inspections/' || p_inspection);
  end if;
  return v_ack;
end $$;
revoke all on function public.acknowledge_inspection(uuid, text) from public, anon;
grant execute on function public.acknowledge_inspection(uuid, text) to authenticated;

-- ---------- Notifica al completamento (proprietario + inquilino) ----------
create or replace function private.inspection_after_complete() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_tenant_profile uuid;
begin
  if new.status = 'completed' and old.status = 'draft' then
    perform private.notify(private.owner_profile_of_property(new.property_id), 'inspection_completed',
      jsonb_build_object('kind', new.kind, 'date', new.performed_at), '/owner/inspections/' || new.id);
    select t.profile_id into v_tenant_profile
    from public.leases l join public.tenants t on t.id = l.tenant_id
    where (new.lease_id is not null and l.id = new.lease_id)
       or (new.lease_id is null and l.property_id = new.property_id and l.status in ('active', 'upcoming'))
    order by l.start_date desc limit 1;
    perform private.notify(v_tenant_profile, 'inspection_completed',
      jsonb_build_object('kind', new.kind, 'date', new.performed_at), '/tenant/inspections/' || new.id);
  end if;
  return new;
end $$;
create trigger inspections_after_complete after update on public.inspections for each row execute function private.inspection_after_complete();

-- ---------- Audit ----------
create trigger audit_inspections after insert or update or delete on public.inspections for each row execute function private.audit_row();
create trigger audit_inspection_items after insert or update or delete on public.inspection_items for each row execute function private.audit_row();
create trigger audit_inspection_photos after insert or delete on public.inspection_photos for each row execute function private.audit_row();

-- Nuove azioni ammesse nel registro eventi (download PDF ispezione e report mensile)
create or replace function public.log_event(p_action text, p_entity text default null, p_entity_id text default null, p_meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_action not in ('auth.login', 'auth.logout', 'auth.mfa_enrolled', 'auth.mfa_unenrolled', 'auth.mfa_verified',
                      'auth.password_changed', 'document.download', 'photo.view', 'statement.pdf_download',
                      'inspection.pdf_download', 'inspection.photo_view', 'report.pdf_download') then
    raise exception 'action not allowed' using errcode = '22023';
  end if;
  if pg_column_size(p_meta) > 2000 then raise exception 'meta too large' using errcode = '22023'; end if;
  perform private.write_audit(p_action, left(p_entity, 60), left(p_entity_id, 80), p_meta);
end $$;

-- ---------- Storage: bucket privato per le foto di ispezione ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('inspection-photos', 'inspection-photos', false, 8388608, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "inspection photos read via table" on storage.objects for select to authenticated
  using (bucket_id = 'inspection-photos' and exists (select 1 from public.inspection_photos ph where ph.storage_path = storage.objects.name));
create policy "inspection photos staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'inspection-photos' and private.is_staff()
              and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
              and private.inspection_is_draft(((storage.foldername(name))[1])::uuid));
create policy "inspection photos staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'inspection-photos' and private.is_staff()
         and not exists (select 1 from public.inspection_photos ph join public.inspections i on i.id = ph.inspection_id
                         where ph.storage_path = storage.objects.name and i.status = 'completed'));
