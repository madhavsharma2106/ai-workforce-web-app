create table public.business_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  business_name text,
  profile_md text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;

create policy "Users can view own business profile"
  on public.business_profiles for select
  using (auth.uid () = user_id);

create policy "Users can insert own business profile"
  on public.business_profiles for insert
  with check (auth.uid () = user_id);

create policy "Users can update own business profile"
  on public.business_profiles for update
  using (auth.uid () = user_id);
