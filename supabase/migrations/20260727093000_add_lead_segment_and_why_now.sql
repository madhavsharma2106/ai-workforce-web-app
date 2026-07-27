-- Supports multiple ICP segments and trigger-event ("why now") reasoning.
-- Both nullable: older leads predate these, and not every founder/candidate
-- has a segment or a trigger event worth calling out.
alter table public.leads
  add column segment text,
  add column why_now text;
