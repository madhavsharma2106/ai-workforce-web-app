---
description: Start the local Supabase stack if needed, apply pending migrations, and verify.
---

Apply pending Supabase migrations against the local dev database, starting the local stack first if it isn't already running.

1. Check whether the local Supabase stack is up: run `npx supabase status`. If it fails or reports the stack is stopped, start it with `npx supabase start` and wait for it to report healthy (this requires Docker to be running locally — if Docker itself isn't available, stop and tell the user to start Docker Desktop first rather than retrying in a loop).
2. Apply pending migrations with `npx supabase migration up`. Do not use `npx supabase db reset` unless the user explicitly asks to wipe local data — `migration up` only applies new migrations and preserves existing rows.
3. Verify: run `npx supabase migration list` and confirm there are no pending (unapplied) migrations left, and confirm the command exited cleanly with no SQL errors.
4. Report back concisely: which migration(s) were applied, and the final `migration list` status. If a migration fails, show the actual Postgres error rather than retrying blindly — most failures are a real schema conflict (e.g. dropping a table something else still references) that needs a fix, not a rerun.
