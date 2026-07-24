-- Reply tracking for Oliver's inbound-reply monitoring. `conversation_id` is
-- Microsoft Graph's thread id, captured when an outreach email is sent
-- (see sendMail in email/outlook.ts) so a later poll can look up replies on
-- that exact thread. `last_reply_message_id` is a dedupe marker: the poller
-- only acts on a reply once, and re-checking a thread on the next tick is a
-- no-op once this matches the newest inbound message id. `reply_status`
-- mirrors `draft_status`'s pending/approved/rejected shape but is nullable —
-- null means "no reply currently awaiting founder action" (the common case),
-- distinct from `'pending'` which means "Oliver drafted a response, waiting
-- on you."
alter table public.leads
  add column conversation_id text,
  add column last_reply_message_id text,
  add column last_reply_snippet text,
  add column reply_draft text not null default '',
  add column reply_status text check (reply_status in ('pending', 'approved', 'rejected')),
  add column reply_run_id uuid references public.agent_runs (id),
  add column reply_send_status text not null default 'not_sent'
    check (reply_send_status in ('not_sent', 'sending', 'sent', 'failed')),
  add column reply_send_error text,
  add column reply_sent_at timestamptz;
