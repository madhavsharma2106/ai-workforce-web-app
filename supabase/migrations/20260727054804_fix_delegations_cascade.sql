-- to_employee_id/to_run_id were left without an ON DELETE action (only
-- from_employee_id/from_run_id cascade), so deleting an employee or run that
-- was ever a delegation *target* fails with an FK violation instead of
-- clearing the (now-orphaned) audit row like the from_* side already does.
-- Surfaced by scripts/reset-user.mts hitting delegations_to_employee_id_fkey.
alter table public.delegations
  drop constraint delegations_to_employee_id_fkey,
  add constraint delegations_to_employee_id_fkey
    foreign key (to_employee_id) references public.employees (id) on delete cascade;

alter table public.delegations
  drop constraint delegations_to_run_id_fkey,
  add constraint delegations_to_run_id_fkey
    foreign key (to_run_id) references public.agent_runs (id) on delete cascade;
