-- Vault must be enabled on this project (Database > Extensions, or this line).
create extension if not exists supabase_vault cascade;

-- Stores the founder's own OAuth grant to their mailbox, so Oliver can send
-- approved outreach as the founder (invisible-ghostwriter model — Graph
-- sends as the delegated identity by construction, no From-override
-- needed). One row per user, not per employee: this is the founder's own
-- mailbox, not something scoped to a specific hired employee. The actual
-- token JSON lives in Supabase Vault (see the wrapper functions below);
-- this table only ever holds a reference to it.
create table public.mailbox_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  email text not null,
  credentials_secret_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index mailbox_connections_one_per_user on public.mailbox_connections (user_id);

alter table public.mailbox_connections enable row level security;

create policy "Users can view own mailbox connection" on public.mailbox_connections
  for select using (auth.uid() = user_id);
create policy "Users can insert own mailbox connection" on public.mailbox_connections
  for insert with check (auth.uid() = user_id);
create policy "Users can update own mailbox connection" on public.mailbox_connections
  for update using (auth.uid() = user_id);
create policy "Users can delete own mailbox connection" on public.mailbox_connections
  for delete using (auth.uid() = user_id);

-- Vault access wrappers: vault.create_secret/update_secret/decrypted_secrets
-- live in the vault schema and aren't exposed via PostgREST directly. These
-- are security definer and grant execute ONLY to service_role, so a mailbox
-- secret can never be created/read/updated/deleted from a normal user
-- session or an anon/authenticated client — only from server code holding
-- the service-role key (connect/disconnect routes, and the send job, which
-- also needs to persist refreshed tokens).
create or replace function public.create_mailbox_secret(secret text, secret_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
begin
  return vault.create_secret(secret, secret_name);
end;
$$;

create or replace function public.read_mailbox_secret(secret_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare decrypted text;
begin
  select decrypted_secret into decrypted from vault.decrypted_secrets where id = secret_id;
  return decrypted;
end;
$$;

create or replace function public.update_mailbox_secret(secret_id uuid, new_secret text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform vault.update_secret(secret_id, new_secret);
end;
$$;

create or replace function public.delete_mailbox_secret(secret_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from vault.secrets where id = secret_id;
end;
$$;

revoke execute on function public.create_mailbox_secret(text, text) from public, authenticated, anon;
revoke execute on function public.read_mailbox_secret(uuid) from public, authenticated, anon;
revoke execute on function public.update_mailbox_secret(uuid, text) from public, authenticated, anon;
revoke execute on function public.delete_mailbox_secret(uuid) from public, authenticated, anon;
grant execute on function public.create_mailbox_secret(text, text) to service_role;
grant execute on function public.read_mailbox_secret(uuid) to service_role;
grant execute on function public.update_mailbox_secret(uuid, text) to service_role;
grant execute on function public.delete_mailbox_secret(uuid) to service_role;

-- send_status is a second gate on leads, independent of status/draft_status:
-- draft_status='approved' means the founder signed off (and, per the
-- Sales Representative's "Send as you" action, triggered a real send);
-- send_status tracks whether Graph actually delivered it. send_error
-- surfaces failures so the founder is never left thinking an email went
-- out when it didn't.
alter table public.leads
  add column subject text not null default '',
  add column send_status text not null default 'not_sent'
    check (send_status in ('not_sent', 'sending', 'sent', 'failed')),
  add column send_error text,
  add column sent_at timestamptz;
