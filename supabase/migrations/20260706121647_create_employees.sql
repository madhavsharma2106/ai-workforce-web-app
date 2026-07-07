create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('account_manager', 'lead_sourcer')),
  status text not null default 'onboarding' check (status in ('onboarding', 'active')),
  created_at timestamptz not null default now()
);

create unique index employees_one_account_manager_per_user
  on public.employees (user_id)
  where role = 'account_manager';

alter table public.employees enable row level security;

create policy "Users can view own employees"
  on public.employees for select
  using (auth.uid () = user_id);

create policy "Users can insert own employees"
  on public.employees for insert
  with check (auth.uid () = user_id);

create policy "Users can update own employees"
  on public.employees for update
  using (auth.uid () = user_id);

alter table public.business_profiles add column contact_name text;
