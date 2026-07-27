create table public.employee_chat_messages (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index employee_chat_messages_employee_id_idx
  on public.employee_chat_messages (employee_id, created_at);

alter table public.employee_chat_messages enable row level security;

create policy "Users can view own employee chat messages"
  on public.employee_chat_messages for select
  using (exists (
    select 1 from public.employees
    where employees.id = employee_chat_messages.employee_id
    and employees.user_id = auth.uid()
  ));

create policy "Users can insert own employee chat messages"
  on public.employee_chat_messages for insert
  with check (exists (
    select 1 from public.employees
    where employees.id = employee_chat_messages.employee_id
    and employees.user_id = auth.uid()
  ));
