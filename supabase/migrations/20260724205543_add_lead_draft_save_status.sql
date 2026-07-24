-- draft_save_status is a third gate on leads, independent of draft_status/
-- send_status: it tracks "Save to Drafts" — pushing the draft into the
-- founder's real mailbox Drafts folder for them to review/edit/send
-- manually, without going through our own send flow at all.
alter table public.leads
  add column draft_save_status text not null default 'not_saved'
    check (draft_save_status in ('not_saved', 'saving', 'saved', 'failed')),
  add column draft_save_error text,
  add column draft_saved_at timestamptz;
