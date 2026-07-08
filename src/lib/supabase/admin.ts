import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for background jobs (Inngest), which run with
 * no user session and so can't use the cookie-bound client in `server.ts`.
 * This bypasses RLS entirely — every query must filter by `user_id`/
 * `employee_id` explicitly. Never import this into client-reachable code.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
