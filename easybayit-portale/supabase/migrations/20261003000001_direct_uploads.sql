-- =============================================================================
-- Upload diretti verso Supabase Storage (URL di caricamento firmati).
-- Vercel limita il corpo delle richieste a 4,5 MB: i file (foto 8 MB, video 50 MB, documenti 10 MB)
-- non passano più dalle funzioni server. Flusso:
--   1) il server verifica sessione, ruolo, appartenenza (RLS), tipo e dimensione dichiarati e crea
--      un "intento" + URL firmato verso pending/<utente>/<uuid>.<ext> (nessun accesso client allo storage);
--   2) il browser carica il file direttamente nello storage (progresso + ritentativi);
--   3) finalizzazione sul server: oggetto esistente, dimensione = dichiarata, tipo reale (magic bytes)
--      ammesso e coerente, impronta SHA-256, data di scatto (EXIF, ispezioni); spostamento nella
--      cartella definitiva e collegamento al record con il client dell'utente (RLS = controllo finale).
--   Gli intenti non finalizzati e gli oggetti orfani in pending/ vengono rimossi dal cron.
-- =============================================================================

create table public.upload_intents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('maintenance', 'inspection', 'document', 'webchat')),
  bucket text not null check (bucket in ('maintenance-photos', 'inspection-photos', 'documents')),
  storage_path text not null unique
    check (storage_path ~ '^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov|pdf)$'),
  target_id uuid,
  declared_mime text not null check (declared_mime in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime')),
  declared_size integer not null check (declared_size > 0 and declared_size <= 52428800),
  original_name text not null default '' check (char_length(original_name) <= 255),
  status text not null default 'pending' check (status in ('pending', 'finalizing', 'finalized', 'rejected', 'expired')),
  reject_reason text check (char_length(reject_reason) <= 40),
  final_path text,
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- l'URL firmato di Supabase vale 2 ore; un'ora di margine per finalizzare
  expires_at timestamptz not null default now() + interval '3 hours',
  finalized_at timestamptz
);
create index on public.upload_intents (created_by, created_at);
create index on public.upload_intents (status, expires_at);

-- Solo il server (service role) legge e scrive gli intenti: RLS attiva, nessuna policy, nessun grant client.
alter table public.upload_intents enable row level security;
revoke all on public.upload_intents from anon, authenticated;

-- Oggetti in pending/ più vecchi di p_older_than senza un intento ancora valido (upload abbandonati,
-- caricamenti ripetuti dopo la finalizzazione, intenti scaduti). Solo service role.
create or replace function public.stale_pending_uploads(p_older_than interval default interval '3 hours', p_limit integer default 500)
returns table (bucket_id text, name text)
language sql stable security definer set search_path = '' as $$
  select o.bucket_id, o.name
  from storage.objects o
  where o.bucket_id in ('maintenance-photos', 'inspection-photos', 'documents')
    and o.name like 'pending/%'
    and o.created_at < now() - p_older_than
    and not exists (
      select 1 from public.upload_intents u
      where u.bucket = o.bucket_id and u.storage_path = o.name
        and u.status in ('pending', 'finalizing') and u.expires_at > now()
    )
  order by o.created_at
  limit least(greatest(p_limit, 1), 1000);
$$;
revoke all on function public.stale_pending_uploads(interval, integer) from public, anon, authenticated;
grant execute on function public.stale_pending_uploads(interval, integer) to service_role;

-- ---------- Metadati calcolati alla finalizzazione ----------
alter table public.maintenance_photos add column sha256 text check (sha256 ~ '^[0-9a-f]{64}$');
alter table public.documents add column sha256 text check (sha256 ~ '^[0-9a-f]{64}$');
alter table public.inspection_photos add column taken_at_source text check (taken_at_source in ('exif', 'manual'));

-- ---------- Storage: nessun caricamento diretto con la sessione dell'utente ----------
-- Tutti i file entrano solo tramite URL firmati emessi dal server dopo i controlli e vengono spostati nella
-- cartella definitiva dal server (service role) alla finalizzazione. Le policy di INSERT/UPDATE per i
-- ruoli client non servono più e vengono rimosse (prima un inquilino poteva caricare con la propria
-- sessione fino a 50 MB senza il controllo del tipo reale). Restano lettura (via riga in tabella) e
-- cancellazione da parte dello staff.
drop policy if exists "photos insert" on storage.objects;
drop policy if exists "inspection photos staff insert" on storage.objects;
drop policy if exists "documents staff insert" on storage.objects;
drop policy if exists "documents staff update" on storage.objects;

-- ---------- Collegamento ai record: il percorso deve stare nella cartella del record ----------
-- (impedisce di collegare a una propria richiesta un oggetto che sta nella cartella di un'altra)
drop policy maint_photos_insert on public.maintenance_photos;
create policy maint_photos_insert on public.maintenance_photos for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and private.can_upload_photo(request_id::text)
              and split_part(storage_path, '/', 1) = request_id::text);
drop policy insp_photos_staff_insert on public.inspection_photos;
create policy insp_photos_staff_insert on public.inspection_photos for insert to authenticated
  with check (private.is_staff() and uploaded_by = (select auth.uid()) and private.inspection_is_draft(inspection_id)
              and split_part(storage_path, '/', 1) = inspection_id::text);
