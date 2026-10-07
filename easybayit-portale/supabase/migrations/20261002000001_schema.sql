-- =============================================================================
-- Easybayit – Portale proprietari/inquilini – Schema di base (Fase 1 / MVP)
-- Tutti gli importi contabili sono in ILS (numeric(12,2)). EUR/USD solo visualizzazione.
-- La sicurezza è applicata nel database con Row Level Security (vedi migrazione _rls).
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Schema privato per funzioni di supporto (NON esposto da PostgREST)
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ---------- Tipi enumerati ----------
create type public.app_role as enum ('admin', 'staff', 'owner', 'tenant');
create type public.property_status as enum ('occupied', 'vacant', 'maintenance');
create type public.lease_status as enum ('upcoming', 'active', 'ended');
create type public.statement_status as enum ('draft', 'published');
create type public.line_category as enum (
  'rent', 'management_fee', 'repair', 'building_fee', 'insurance', 'arnona', 'utilities', 'listing', 'cleaning', 'other'
);
create type public.maint_priority as enum ('routine', 'urgent');
create type public.maint_status as enum ('reported', 'in_review', 'quote_pending', 'approved', 'scheduled', 'closed', 'cancelled');
create type public.quote_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.doc_category as enum ('lease', 'insurance', 'invoice', 'statement', 'photo', 'report', 'other');
create type public.payment_kind as enum ('rent', 'deposit', 'payout', 'other');
create type public.payment_method as enum ('bank_transfer', 'standing_order', 'check', 'cash', 'other');
create type public.payment_status as enum ('paid', 'late', 'pending');

-- ---------- Funzione comune: updated_at ----------
create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Profili utente (1:1 con auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'tenant',
  full_name text not null default '' check (char_length(full_name) <= 200),
  email text not null check (char_length(email) <= 320),
  locale text not null default 'en' check (locale in ('en', 'he', 'it')),
  preferred_currency text not null default 'ILS' check (preferred_currency in ('ILS', 'EUR', 'USD')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();

-- Creazione automatica del profilo. Il ruolo arriva SOLO da app_metadata
-- (impostabile solo con la service key), mai da user_metadata (modificabile dall'utente).
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_role public.app_role;
begin
  begin
    v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'tenant');
  exception when others then
    v_role := 'tenant';
  end;
  insert into public.profiles (id, role, full_name, email, locale)
  values (
    new.id, v_role,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 200),
    coalesce(new.email, ''),
    case when new.raw_user_meta_data ->> 'locale' in ('en', 'he', 'it') then new.raw_user_meta_data ->> 'locale' else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------- Anagrafiche ----------
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 40),
  country text check (char_length(country) <= 80),
  approval_limit_ils numeric(12, 2) not null default 1000 check (approval_limit_ils >= 0),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger owners_touch before update on public.owners for each row execute function private.touch_updated_at();

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 40),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tenants_touch before update on public.tenants for each row execute function private.touch_updated_at();

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete restrict,
  code text not null unique check (char_length(code) between 1 and 20),
  name text not null check (char_length(name) between 1 and 200),
  address text not null check (char_length(address) between 1 and 300),
  city text not null check (char_length(city) between 1 and 100),
  rooms numeric(3, 1) check (rooms > 0 and rooms < 50),
  size_sqm numeric(7, 1) check (size_sqm > 0),
  status public.property_status not null default 'vacant',
  asking_rent_ils numeric(12, 2) check (asking_rent_ils >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.properties (owner_id);
create trigger properties_touch before update on public.properties for each row execute function private.touch_updated_at();

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  monthly_rent_ils numeric(12, 2) not null check (monthly_rent_ils >= 0),
  deposit_ils numeric(12, 2) not null default 0 check (deposit_ils >= 0),
  payment_day smallint not null default 1 check (payment_day between 1 and 28),
  status public.lease_status not null default 'active',
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);
create index on public.leases (property_id);
create index on public.leases (tenant_id);
create trigger leases_touch before update on public.leases for each row execute function private.touch_updated_at();

-- ---------- Rendiconti mensili ----------
create table public.statements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete restrict,
  period date not null check (extract(day from period) = 1), -- primo giorno del mese
  status public.statement_status not null default 'draft',
  notes text check (char_length(notes) <= 2000),
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, period)
);
create trigger statements_touch before update on public.statements for each row execute function private.touch_updated_at();

create table public.statement_lines (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.statements (id) on delete cascade,
  property_id uuid references public.properties (id) on delete restrict,
  line_date date not null,
  category public.line_category not null,
  description text not null default '' check (char_length(description) <= 300),
  amount_ils numeric(12, 2) not null check (amount_ils <> 0), -- positivo = entrata, negativo = uscita
  document_id uuid,
  created_at timestamptz not null default now()
);
create index on public.statement_lines (statement_id);

-- La riga deve riferirsi a un immobile dello stesso proprietario del rendiconto
create or replace function private.check_statement_line() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.property_id is not null and not exists (
    select 1 from public.statements s join public.properties p on p.owner_id = s.owner_id
    where s.id = new.statement_id and p.id = new.property_id
  ) then
    raise exception 'property does not belong to the statement owner' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger statement_lines_check before insert or update on public.statement_lines
  for each row execute function private.check_statement_line();

-- ---------- Manutenzione ----------
create sequence public.maintenance_ref_seq start 1001;
create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  ref integer not null unique default nextval('public.maintenance_ref_seq'),
  property_id uuid not null references public.properties (id) on delete restrict,
  tenant_id uuid references public.tenants (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '' check (char_length(description) <= 4000),
  priority public.maint_priority not null default 'routine',
  status public.maint_status not null default 'reported',
  scheduled_for date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.maintenance_requests (property_id);
create index on public.maintenance_requests (tenant_id);
create trigger maint_touch before update on public.maintenance_requests for each row execute function private.touch_updated_at();

create table public.maintenance_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  status public.maint_status,
  note text check (char_length(note) <= 2000),
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.maintenance_events (request_id);

create table public.maintenance_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 8388608),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.maintenance_photos (request_id);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  supplier text not null check (char_length(supplier) between 1 and 200),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  total_ils numeric(12, 2) not null check (total_ils >= 0),
  status public.quote_status not null default 'pending',
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  decision_note text check (char_length(decision_note) <= 1000),
  document_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.quotes (request_id);

-- ---------- Documenti ----------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  category public.doc_category not null default 'other',
  property_id uuid references public.properties (id) on delete set null,
  owner_id uuid references public.owners (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  visible_to_owner boolean not null default true,
  visible_to_tenant boolean not null default false,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.documents (property_id);
create index on public.documents (owner_id);
create index on public.documents (tenant_id);
alter table public.statement_lines add constraint statement_lines_document_fk foreign key (document_id) references public.documents (id) on delete set null;
alter table public.quotes add constraint quotes_document_fk foreign key (document_id) references public.documents (id) on delete set null;

-- ---------- Pagamenti (solo storico: NESSUN incasso online, nessun dato di carta) ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  lease_id uuid references public.leases (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  kind public.payment_kind not null default 'rent',
  paid_on date not null,
  period date, -- mese di competenza (primo del mese)
  amount_ils numeric(12, 2) not null check (amount_ils > 0),
  method public.payment_method not null default 'bank_transfer',
  status public.payment_status not null default 'paid',
  reference text check (char_length(reference) <= 120),
  source text not null default 'manual' check (source in ('manual', 'csv')),
  import_batch uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.payments (property_id);
create index on public.payments (tenant_id);
create index on public.payments (paid_on);

-- ---------- Notifiche in-app + coda email (outbox transazionale) ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (char_length(kind) <= 60),
  params jsonb not null default '{}'::jsonb,
  link text check (char_length(link) <= 300),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (profile_id, created_at desc);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  to_email text not null,
  locale text not null default 'en',
  kind text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index on public.email_outbox (status, created_at);

-- ---------- Log di audit (append-only) ----------
create table public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid, -- nessuna FK: il log deve sopravvivere alla cancellazione degli utenti
  actor_role text,
  action text not null check (char_length(action) <= 80),
  entity text check (char_length(entity) <= 60),
  entity_id text check (char_length(entity_id) <= 80),
  meta jsonb not null default '{}'::jsonb
);
create index on public.audit_log (actor_id, created_at desc);
create index on public.audit_log (entity, entity_id);

-- ---------- Cambi BOI in cache (solo visualizzazione) ----------
create table public.fx_rates (
  currency text not null check (currency in ('USD', 'EUR')),
  rate_date date not null,
  ils_per_unit numeric(12, 6) not null check (ils_per_unit > 0),
  fetched_at timestamptz not null default now(),
  primary key (currency, rate_date)
);

-- ---------- Rate limiting (es. login), usabile anche su serverless ----------
create table private.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null
);
