# Database

Supabase (Postgres) backs both auth and persistence. Auth is wired via `@supabase/ssr` (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`); this doc covers the persistence side — schema and how to change it.

## Env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server/job-only, never imported client-side (see `src/lib/supabase/admin.ts`). Used by background jobs (Inngest), which run with no user session and so bypass RLS entirely — job code must filter every query by `user_id`/`employee_id` itself. See [AGENTS.md](AGENTS.md).

Find all three in the Supabase project settings under API. See `.env.example`.

## CLI

The Supabase CLI is a devDependency, invoked via `npx supabase ...` — no global install needed.

One-time setup per machine:

```
npx supabase login                            # opens a browser to authorize the CLI
npx supabase link --project-ref <project-ref> # project-ref is in the dashboard URL/settings
```

## Migrations

Schema changes are SQL files under `supabase/migrations/`, applied to the linked remote project with:

```
npx supabase db push
```

To add a new migration, create a new timestamped file in `supabase/migrations/` (e.g. `date -u +%Y%m%d%H%M%S` for the prefix) and run `db push` again. Don't edit past migrations — add a new one.

Check current state with `npx supabase migration list` (compares local files against what's applied remotely).

## Schema

| Table | Purpose | Key columns |
|---|---|---|
| `business_profiles` | The Account Manager's Business Profile — one row per user | `user_id` (PK, → `auth.users`), `profile_md` (the profile itself, markdown), `business_name`, `contact_name` (the user's preferred name, collected during Account Manager onboarding), `updated_at` |
| `employees` | One row per hired employee (see [UX.md](UX.md): Role vs. Employee) | `id` (PK), `user_id` (→ `auth.users`), `role` (`account_manager` \| `lead_sourcer`), `status` (`onboarding` \| `active`), `created_at`. A partial unique index enforces at most one `account_manager` row per user. |
| `conversations` | Turn-based chat history with an employee, generic across roles | `id` (PK), `user_id`, `employee_id` (→ `employees`), `kind` (`onboarding` \| `chat`), `status`, `created_at`, `updated_at` |
| `messages` | Individual turns within a conversation | `id` (PK), `user_id`, `conversation_id` (→ `conversations`), `role` (`user` \| `assistant` \| `tool`), `parts` (jsonb, AI SDK `UIMessage.parts`), `created_at` |
| `agent_runs` | One autonomous/background run of an employee (may span a delegation chain) | `id` (PK), `user_id`, `employee_id` (→ `employees`), `trigger` (`manual` \| `delegation`), `status` (`queued` \| `running` \| `waiting_approval` \| `completed` \| `failed`), `summary`, `job_id` (Inngest run id), `started_at`, `completed_at`, `created_at` |
| `agent_run_steps` | Step-by-step trail within a run, for the eventual "what is this employee doing" view | `id` (PK), `user_id`, `run_id` (→ `agent_runs`), `seq`, `type` (`thinking` \| `tool_call` \| `tool_result` \| `message` \| `delegation`), `tool_name`, `input`/`output` (jsonb), `label` (synthesized, on-brand narration text — see [AGENTS.md](AGENTS.md)), `status`, `created_at` |
| `delegations` | Audit record of one employee handing work to another | `id` (PK), `user_id`, `from_employee_id`, `to_role`, `to_employee_id`, `from_run_id`, `to_run_id`, `reason`, `context` (jsonb), `status` (`pending` \| `accepted` \| `completed` \| `declined`), `created_at` |

`business_profiles` now has a real writer/reader: Account Manager onboarding (`/api/employees/[id]/complete-onboarding`) writes it, and Lead Sourcer's first run reads `profile_md` as the search input — see [src/lib/employees.ts](../src/lib/employees.ts) and [src/lib/leadSearch.ts](../src/lib/leadSearch.ts).

`agent_runs` and `agent_run_steps` are on the Supabase Realtime publication, so the frontend can subscribe to a run's progress live instead of polling or reading from `sessionStorage`. See [AGENTS.md](AGENTS.md) for how these tables get written to (the LangGraph delegation graph, run by Inngest jobs).

RLS is enabled on all tables; policies scope rows to `auth.uid() = user_id`, so each user only sees their own data. Background jobs (Inngest) don't have a user session and use a service-role client that bypasses RLS — see the `SUPABASE_SERVICE_ROLE_KEY` note above.
