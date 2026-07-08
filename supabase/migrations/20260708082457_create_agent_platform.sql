-- Turn-based chat history (onboarding today, any future chat), generic across roles.
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  kind text not null check (kind in ('onboarding', 'chat')),
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid () = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid () = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid () = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  parts jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid () = user_id);

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid () = user_id);

-- Autonomous/background work. Written exclusively by background jobs via the
-- service-role client (which bypasses RLS) — the authenticated user can only
-- ever read these, never write them directly.
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  trigger text not null check (trigger in ('manual', 'delegation')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'waiting_approval', 'completed', 'failed')),
  summary text,
  job_id text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.agent_runs enable row level security;

create policy "Users can view own agent runs"
  on public.agent_runs for select
  using (auth.uid () = user_id);

create table public.agent_run_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  run_id uuid not null references public.agent_runs (id) on delete cascade,
  seq int not null,
  type text not null check (type in ('thinking', 'tool_call', 'tool_result', 'message', 'delegation')),
  tool_name text,
  input jsonb,
  output jsonb,
  label text,
  status text not null default 'completed' check (status in ('running', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.agent_run_steps enable row level security;

create policy "Users can view own agent run steps"
  on public.agent_run_steps for select
  using (auth.uid () = user_id);

-- Audit record of one employee handing work to another. Written by the
-- delegation graph via the service-role client, same read-only-for-users
-- posture as agent_runs/agent_run_steps.
create table public.delegations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_employee_id uuid not null references public.employees (id) on delete cascade,
  to_role text not null check (to_role in ('account_manager', 'lead_sourcer')),
  to_employee_id uuid references public.employees (id),
  from_run_id uuid not null references public.agent_runs (id) on delete cascade,
  to_run_id uuid references public.agent_runs (id),
  reason text not null,
  context jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'completed', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.delegations enable row level security;

create policy "Users can view own delegations"
  on public.delegations for select
  using (auth.uid () = user_id);

alter publication supabase_realtime add table public.agent_runs;
alter publication supabase_realtime add table public.agent_run_steps;
