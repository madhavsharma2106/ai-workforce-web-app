-- conversations/messages only backed the test-chat harness, which has been
-- removed (src/lib/conversations.ts and its two callers). Dropping rather
-- than leaving dormant schema; real chat will define tables around its own
-- requirements when it's built.
drop table if exists public.messages;
drop table if exists public.conversations;
