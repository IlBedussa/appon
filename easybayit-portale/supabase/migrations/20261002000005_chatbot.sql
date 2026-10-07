-- =============================================================================
-- Bot di manutenzione per inquilini (WhatsApp Cloud API + web chat del portale)
-- Stato della conversazione nel DB, idempotenza sui messaggi del provider,
-- aggiornamenti di stato rimandati in chat tramite coda (chat_outbox).
-- =============================================================================

-- numero normalizzato (solo cifre, 0XX… israeliani -> 972XX…) per riconoscere il mittente WhatsApp
alter table public.tenants add column phone_digits text generated always as (
  case when regexp_replace(coalesce(phone, ''), '\D', '', 'g') ~ '^0\d{9}$'
       then '972' || substr(regexp_replace(phone, '\D', '', 'g'), 2)
       else regexp_replace(coalesce(phone, ''), '\D', '', 'g') end) stored;
create index on public.tenants (phone_digits);

-- origine e dati raccolti dal bot sulla richiesta
alter table public.maintenance_requests add column source text not null default 'portal' check (source in ('portal', 'staff', 'whatsapp', 'webchat'));
alter table public.maintenance_requests add column category text check (category in ('plumbing', 'electrical', 'heating_ac', 'appliances', 'doors_windows', 'gas', 'pests', 'other'));
alter table public.maintenance_requests add column availability text check (char_length(availability) <= 200);
alter table public.maintenance_requests add column emergency text check (emergency in ('gas', 'flood', 'power', 'security'));

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('whatsapp', 'webchat')),
  external_id text not null check (char_length(external_id) between 1 and 64),
  tenant_id uuid references public.tenants (id) on delete set null,
  locale text not null default 'en' check (locale in ('en', 'he', 'it', 'fr', 'ru')),
  state text not null default 'start',
  data jsonb not null default '{}'::jsonb,
  request_id uuid references public.maintenance_requests (id) on delete set null,
  last_inbound_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- una sola conversazione aperta per mittente e canale
create unique index chat_conv_open_uniq on public.chat_conversations (channel, external_id) where closed_at is null;
create index on public.chat_conversations (request_id);
create trigger chat_conv_updated before update on public.chat_conversations for each row execute function private.touch_updated_at();

create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  body text not null default '' check (char_length(body) <= 5000),
  buttons jsonb,
  media jsonb,
  provider_message_id text,
  created_at timestamptz not null default now()
);
create index on public.chat_messages (conversation_id, id);

-- idempotenza: Meta può consegnare lo stesso evento più volte
create table private.chat_inbound_dedup (
  provider text not null,
  message_id text not null,
  received_at timestamptz not null default now(),
  primary key (provider, message_id)
);

-- coda di notifiche verso la chat (renderizzate nella lingua della conversazione dall'app)
create table public.chat_outbox (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  kind text not null,
  params jsonb not null default '{}'::jsonb,
  attempts smallint not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index on public.chat_outbox (created_at) where sent_at is null;

-- RLS: lettura per staff (2FA) e per l'inquilino sulle proprie conversazioni; scritture solo lato server (service role)
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_outbox enable row level security;
alter table private.chat_inbound_dedup enable row level security;
create policy chat_conv_read on public.chat_conversations for select to authenticated
  using (private.is_staff() or (private.mfa_ok() and tenant_id is not null and tenant_id = private.my_tenant_id()));
create policy chat_msg_read on public.chat_messages for select to authenticated
  using (exists (select 1 from public.chat_conversations c where c.id = conversation_id
    and (private.is_staff() or (private.mfa_ok() and c.tenant_id is not null and c.tenant_id = private.my_tenant_id()))));
revoke insert, update, delete on public.chat_conversations, public.chat_messages, public.chat_outbox from anon, authenticated;
revoke all on public.chat_outbox from anon, authenticated;
revoke all on private.chat_inbound_dedup from anon, authenticated;

-- Idempotenza atomica: true solo la prima volta che si vede (provider, message_id)
create or replace function public.chat_claim_message(p_provider text, p_message_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into private.chat_inbound_dedup (provider, message_id) values (p_provider, p_message_id) on conflict do nothing;
  get diagnostics n = row_count;
  return n = 1;
end $$;
revoke all on function public.chat_claim_message(text, text) from public, anon, authenticated;
grant execute on function public.chat_claim_message(text, text) to service_role;

-- Aggiornamento di stato della richiesta -> messaggio in chat al mittente
create or replace function private.chat_status_push() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.source in ('whatsapp', 'webchat') then
    insert into public.chat_outbox (conversation_id, kind, params)
    select c.id, 'status', jsonb_build_object('ref', new.ref, 'status', new.status, 'scheduled_for', new.scheduled_for)
    from public.chat_conversations c where c.request_id = new.id
    order by c.created_at desc limit 1;
  end if;
  return new;
end $$;
create trigger maint_chat_status after update of status on public.maintenance_requests for each row execute function private.chat_status_push();

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
