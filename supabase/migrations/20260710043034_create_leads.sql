-- Qualified leads produced by a Lead Sourcer's agent run. One row per
-- company the model decided (via the `save_lead` tool) was genuinely
-- qualified — unlike `agent_runs`/`agent_run_steps`, users mutate these
-- directly (approve/reject/edit draft/reveal email), so unlike that
-- read-only-for-users precedent, this table also grants users `update`.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  run_id uuid not null references public.agent_runs (id) on delete cascade,
  company text not null,
  website text not null default '',
  fit text not null default '',
  decision_maker text not null default '',
  email text not null default '',
  draft text not null default '',
  sources text not null default '',
  person_id text,
  email_revealed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  feedback_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Users can view own leads"
  on public.leads for select
  using (auth.uid () = user_id);

create policy "Users can update own leads"
  on public.leads for update
  using (auth.uid () = user_id);
