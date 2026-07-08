alter table public.employees
  drop constraint employees_role_check,
  add constraint employees_role_check
    check (role in ('account_manager', 'lead_sourcer', 'sales_representative'));

alter table public.delegations
  drop constraint delegations_to_role_check,
  add constraint delegations_to_role_check
    check (to_role in ('account_manager', 'lead_sourcer', 'sales_representative'));
