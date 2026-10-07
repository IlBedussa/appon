-- =============================================================================
-- Funzioni di business, audit automatico, notifiche e coda email.
-- =============================================================================

-- ---------- Audit ----------
create or replace function private.write_audit(p_action text, p_entity text, p_entity_id text, p_meta jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values ((select auth.uid()), coalesce(private.current_app_role()::text, (select auth.role())), p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'::jsonb));
end $$;

-- Trigger generico: registra chi crea/modifica/cancella dati sensibili (solo i NOMI dei campi cambiati)
create or replace function private.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_id text;
  v_meta jsonb := '{}'::jsonb;
begin
  if tg_op = 'DELETE' then
    v_id := (to_jsonb(old) ->> 'id');
  else
    v_id := (to_jsonb(new) ->> 'id');
  end if;
  if tg_op = 'UPDATE' then
    select jsonb_build_object('changed', coalesce(jsonb_agg(k), '[]'::jsonb)) into v_meta
    from jsonb_each(to_jsonb(new)) as n(k, v)
    where k not in ('updated_at') and (to_jsonb(old) -> k) is distinct from v;
    if v_meta -> 'changed' = '[]'::jsonb then return new; end if;
  end if;
  if tg_table_name = 'payments' and tg_op <> 'DELETE' then
    v_meta := v_meta || jsonb_build_object('amount_ils', new.amount_ils, 'source', new.source);
  end if;
  perform private.write_audit(tg_table_name || '.' || lower(tg_op), tg_table_name, v_id, v_meta);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['owners','tenants','properties','leases','statements','statement_lines','quotes','documents','payments','maintenance_requests','profiles']
  loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function private.audit_row()', t);
  end loop;
end $$;

-- Eventi registrati esplicitamente dall'app (login, download, ecc.). Azioni ammesse in whitelist.
create or replace function public.log_event(p_action text, p_entity text default null, p_entity_id text default null, p_meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_action not in ('auth.login', 'auth.logout', 'auth.mfa_enrolled', 'auth.mfa_unenrolled', 'auth.mfa_verified',
                      'auth.password_changed', 'document.download', 'photo.view', 'statement.pdf_download') then
    raise exception 'action not allowed' using errcode = '22023';
  end if;
  if pg_column_size(p_meta) > 2000 then raise exception 'meta too large' using errcode = '22023'; end if;
  perform private.write_audit(p_action, left(p_entity, 60), left(p_entity_id, 80), p_meta);
end $$;
revoke all on function public.log_event(text, text, text, jsonb) from public, anon;
grant execute on function public.log_event(text, text, text, jsonb) to authenticated;

-- ---------- Notifiche (in-app + email in coda) ----------
create or replace function private.notify(p_profile uuid, p_kind text, p_params jsonb, p_link text, p_email boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare v_p public.profiles;
begin
  if p_profile is null then return; end if;
  select * into v_p from public.profiles where id = p_profile and is_active;
  if not found then return; end if;
  insert into public.notifications (profile_id, kind, params, link) values (p_profile, p_kind, coalesce(p_params, '{}'::jsonb), p_link);
  if p_email and v_p.email <> '' then
    insert into public.email_outbox (profile_id, to_email, locale, kind, params)
    values (p_profile, v_p.email, v_p.locale, p_kind, coalesce(p_params, '{}'::jsonb) || jsonb_build_object('link', p_link));
  end if;
end $$;

create or replace function private.notify_staff(p_kind text, p_params jsonb, p_link text)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select id from public.profiles where role in ('admin', 'staff') and is_active loop
    perform private.notify(r.id, p_kind, p_params, p_link, true);
  end loop;
end $$;

create or replace function private.owner_profile_of_property(p_property uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select o.profile_id from public.properties p join public.owners o on o.id = p.owner_id where p.id = p_property
$$;

-- ---------- Manutenzione: timeline automatica e notifiche ----------
create or replace function private.maint_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.maintenance_events (request_id, status, actor_id) values (new.id, new.status, (select auth.uid()));
  perform private.notify_staff('maint.new', jsonb_build_object('ref', new.ref, 'title', new.title, 'priority', new.priority), '/admin/maintenance/' || new.id);
  perform private.notify(private.owner_profile_of_property(new.property_id), 'maint.new_owner',
    jsonb_build_object('ref', new.ref, 'title', new.title), '/owner/maintenance/' || new.id, new.priority = 'urgent');
  return new;
end $$;
create trigger maint_after_insert after insert on public.maintenance_requests for each row execute function private.maint_after_insert();

create or replace function private.maint_after_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_tenant_profile uuid;
begin
  if new.status is distinct from old.status then
    insert into public.maintenance_events (request_id, status, actor_id) values (new.id, new.status, (select auth.uid()));
    select t.profile_id into v_tenant_profile from public.tenants t where t.id = new.tenant_id;
    perform private.notify(v_tenant_profile, 'maint.status', jsonb_build_object('ref', new.ref, 'status', new.status), '/tenant/requests/' || new.id, true);
    if new.status in ('scheduled', 'closed') then
      perform private.notify(private.owner_profile_of_property(new.property_id), 'maint.status',
        jsonb_build_object('ref', new.ref, 'status', new.status), '/owner/maintenance/' || new.id, false);
    end if;
  end if;
  return new;
end $$;
create trigger maint_after_status after update of status on public.maintenance_requests for each row execute function private.maint_after_status();

-- Nuovo preventivo: richiesta -> "in attesa di approvazione" e notifica al proprietario
create or replace function private.quote_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_req public.maintenance_requests;
begin
  select * into v_req from public.maintenance_requests where id = new.request_id;
  if new.status = 'pending' then
    update public.maintenance_requests set status = 'quote_pending' where id = new.request_id and status not in ('closed', 'cancelled');
    perform private.notify(private.owner_profile_of_property(v_req.property_id), 'quote.pending',
      jsonb_build_object('ref', v_req.ref, 'title', v_req.title, 'total_ils', new.total_ils), '/owner/maintenance/' || v_req.id, true);
  end if;
  return new;
end $$;
create trigger quote_after_insert after insert on public.quotes for each row execute function private.quote_after_insert();

-- Decisione del proprietario sul preventivo (unico modo per il proprietario di modificare un preventivo)
create or replace function public.decide_quote(p_quote uuid, p_decision text, p_note text default null)
returns public.quote_status language plpgsql security definer set search_path = '' as $$
declare
  v_q public.quotes;
  v_req public.maintenance_requests;
  v_status public.quote_status;
begin
  if p_decision not in ('approve', 'reject') then raise exception 'invalid decision' using errcode = '22023'; end if;
  if p_note is not null and char_length(p_note) > 1000 then raise exception 'note too long' using errcode = '22023'; end if;
  select * into v_q from public.quotes where id = p_quote for update;
  if not found then raise exception 'quote not found' using errcode = 'P0002'; end if;
  select * into v_req from public.maintenance_requests where id = v_q.request_id;
  -- solo il proprietario dell'immobile (con 2FA rispettata, verificata da my_owner_id)
  if not private.owns_property(v_req.property_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_q.status <> 'pending' then raise exception 'quote already decided' using errcode = '22023'; end if;

  v_status := case when p_decision = 'approve' then 'approved'::public.quote_status else 'rejected'::public.quote_status end;
  update public.quotes set status = v_status, decided_by = (select auth.uid()), decided_at = now(), decision_note = nullif(trim(p_note), '')
  where id = p_quote;
  update public.maintenance_requests
    set status = case when v_status = 'approved' then 'approved'::public.maint_status else 'in_review'::public.maint_status end
  where id = v_req.id;
  insert into public.maintenance_events (request_id, status, note, actor_id)
  values (v_req.id, null, case when v_status = 'approved' then 'quote approved by owner' else 'quote rejected by owner' end
          || coalesce(': ' || nullif(trim(p_note), ''), ''), (select auth.uid()));
  perform private.write_audit('quote.' || v_status::text, 'quotes', p_quote::text,
    jsonb_build_object('total_ils', v_q.total_ils, 'request_ref', v_req.ref));
  perform private.notify_staff('quote.decided', jsonb_build_object('ref', v_req.ref, 'decision', v_status, 'total_ils', v_q.total_ils), '/admin/maintenance/' || v_req.id);
  return v_status;
end $$;
revoke all on function public.decide_quote(uuid, text, text) from public, anon;
grant execute on function public.decide_quote(uuid, text, text) to authenticated;

-- ---------- Rendiconti: data di pubblicazione e notifica ----------
create or replace function private.statement_before() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end $$;
create trigger statement_before before insert or update on public.statements for each row execute function private.statement_before();

create or replace function private.statement_after() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_profile uuid;
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    select profile_id into v_profile from public.owners where id = new.owner_id;
    perform private.notify(v_profile, 'statement.published', jsonb_build_object('period', to_char(new.period, 'YYYY-MM')), '/owner/statements/' || new.id, true);
  end if;
  return new;
end $$;
create trigger statement_after after insert or update on public.statements for each row execute function private.statement_after();

-- ---------- Documenti: notifica a chi può vederli ----------
create or replace function private.document_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_owner_profile uuid; v_tenant_profile uuid;
begin
  if new.visible_to_owner then
    if new.owner_id is not null then
      select profile_id into v_owner_profile from public.owners where id = new.owner_id;
    elsif new.property_id is not null then
      v_owner_profile := private.owner_profile_of_property(new.property_id);
    end if;
    perform private.notify(v_owner_profile, 'document.new', jsonb_build_object('title', new.title), '/owner/documents', true);
  end if;
  if new.visible_to_tenant then
    select t.profile_id into v_tenant_profile from public.tenants t
    where t.id = coalesce(new.tenant_id, (select l.tenant_id from public.leases l where l.id = new.lease_id));
    perform private.notify(v_tenant_profile, 'document.new', jsonb_build_object('title', new.title), '/tenant/documents', true);
  end if;
  return new;
end $$;
create trigger document_after_insert after insert on public.documents for each row execute function private.document_after_insert();

-- ---------- Pagamenti: notifica in-app al proprietario (niente email, per non intasare con gli import CSV) ----------
create or replace function private.payment_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'pending' then
    perform private.notify(private.owner_profile_of_property(new.property_id), 'payment.recorded',
      jsonb_build_object('kind', new.kind, 'amount_ils', new.amount_ils, 'paid_on', new.paid_on), '/owner/payments', false);
  end if;
  return new;
end $$;
create trigger payment_after_insert after insert on public.payments for each row execute function private.payment_after_insert();

-- ---------- Rate limiting a finestra fissa (solo service role) ----------
create or replace function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_hits integer;
begin
  insert into private.rate_limits as rl (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rl.hits + 1 end,
    window_start = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then now() else rl.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;
create or replace function public.rate_limit_reset(p_key text) returns void
language sql security definer set search_path = '' as $$ delete from private.rate_limits where key = p_key $$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.rate_limit_reset(text) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.rate_limit_reset(text) to service_role;

-- Le funzioni private non sono invocabili via API (schema non esposto), ma revochiamo comunque ad anon
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
