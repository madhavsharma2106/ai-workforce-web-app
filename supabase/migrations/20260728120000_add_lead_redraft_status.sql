-- redraft_status tracks a founder-triggered "redraft pending emails" pass
-- (fired after editing Oliver's instructions), independent of draft_status.
-- Null means no redraft is in flight/failed for this lead; the existing
-- draft/draft_status columns are the source of truth for the email content
-- itself and are overwritten in place by the redraft, same as the original
-- draft write.
alter table public.leads
  add column redraft_status text check (redraft_status in ('redrafting', 'failed')),
  add column redraft_error text;
