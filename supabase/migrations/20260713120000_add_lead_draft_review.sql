-- Second approval gate, owned by the Sales Representative: qualifying a
-- lead (`status`) no longer implies a draft exists. `draft_status` tracks
-- founder review of the outreach email Oliver drafts after handoff;
-- `draft_run_id` points at the agent_runs row that last wrote `draft`.
alter table public.leads
  add column draft_status text not null default 'pending' check (draft_status in ('pending', 'approved', 'rejected')),
  add column draft_run_id uuid references public.agent_runs (id);
