-- Hardening dei permessi (revisione interna 2 ott 2026). Difesa in profondità: nessun cambiamento funzionale.
-- 1) Le tabelle della chat (migrazione 000005) erano state create dopo il "revoke all ... from anon" della 000002:
--    anon aveva ancora SELECT/TRUNCATE/REFERENCES/TRIGGER (RLS bloccava comunque le righe).
revoke all on public.chat_conversations, public.chat_messages from anon;
-- 2) TRUNCATE non è soggetto a RLS: nessun ruolo client deve averlo (né REFERENCES/TRIGGER).
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
-- 3) Funzioni dello schema private create dopo la 000004 (ispezioni): eseguibili da anon per default.
revoke all on all functions in schema private from public, anon;
--    (le policy RLS e dello storage le usano come utente autenticato: si ri-concede l'esecuzione esplicita)
grant execute on all functions in schema private to authenticated, service_role;
-- 4) Tabelle e funzioni future: stessi default.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke truncate, references, trigger on tables from authenticated;
alter default privileges for role postgres in schema private revoke execute on functions from public, anon;
alter default privileges for role postgres in schema private grant execute on functions to authenticated, service_role;
