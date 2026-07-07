# Database

Supabase (Postgres) backs both auth and persistence. Auth is wired via `@supabase/ssr` (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`); this doc covers the persistence side — schema and how to change it.

## Env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Find both in the Supabase project settings under API. See `.env.example`.

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
| `employees` | One row per hired employee (see [TERMINOLOGY.md](TERMINOLOGY.md): Role vs. Employee) | `id` (PK), `user_id` (→ `auth.users`), `role` (`account_manager` \| `lead_sourcer`), `status` (`onboarding` \| `active`), `created_at`. A partial unique index enforces at most one `account_manager` row per user. |

`business_profiles` now has a real writer/reader: Account Manager onboarding (`/api/employees/[id]/complete-onboarding`) writes it, and Lead Sourcer's first run reads `profile_md` as the search input — see [src/lib/employees.ts](../src/lib/employees.ts) and [src/lib/leadSearch.ts](../src/lib/leadSearch.ts).

RLS is enabled on all tables; policies scope rows to `auth.uid() = user_id`, so each user only sees their own data.
