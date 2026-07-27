/**
 * Wipes all data for a single user while keeping their auth account (they
 * can log back in to a clean slate, re-onboard, etc). Does NOT touch
 * auth.users — use the Supabase dashboard for a full account delete.
 *
 * Usage:
 *   node --env-file=.env.local --experimental-strip-types scripts/reset-user.mts <email> [--yes]
 *
 * Without --yes, prints what will be deleted and asks for confirmation
 * (type the email) before touching anything.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";

async function main() {
  const [email, ...flags] = process.argv.slice(2);
  const skipConfirm = flags.includes("--yes");

  if (!email) {
    console.error("Usage: reset-user.mts <email> [--yes]");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — run with --env-file=.env.local",
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await findUserIdByEmail(admin, email);
  if (!userId) {
    console.error(`No auth user found with email ${email}`);
    process.exit(1);
  }

  const counts = await countUserData(admin, userId);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log(`\nUser: ${email} (${userId})`);
  console.log("Rows that will be deleted:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }
  console.log(`  total: ${total}`);
  console.log("\nThe auth account itself is kept — this only wipes data.\n");

  if (total === 0) {
    console.log("Nothing to delete.");
    return;
  }

  if (!skipConfirm) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`Type the email (${email}) to confirm: `);
    rl.close();
    if (answer.trim() !== email) {
      console.log("Confirmation did not match — aborted.");
      return;
    }
  }

  await resetUser(admin, userId);
  console.log("Done.");
}

async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  // supabase-js has no getUserByEmail; page through admin.listUsers and match
  // client-side (fine at current user volumes).
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function countUserData(admin: SupabaseClient, userId: string) {
  const tables = [
    "leads",
    "delegations",
    "agent_run_steps",
    "agent_runs",
    "mailbox_connections",
    "employees",
    "business_profiles",
  ] as const;

  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw error;
    counts[table] = count ?? 0;
  }
  return counts;
}

async function resetUser(admin: SupabaseClient, userId: string) {
  // Vault secrets aren't part of the FK graph, so the mailbox's OAuth
  // credentials must be cleaned up explicitly before/independent of the
  // mailbox_connections row, or they'd be orphaned in Vault forever.
  const { data: mailbox } = await admin
    .from("mailbox_connections")
    .select("credentials_secret_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (mailbox) {
    const { error } = await admin.rpc("delete_mailbox_secret", {
      secret_id: mailbox.credentials_secret_id,
    });
    if (error) throw error;
  }
  await deleteWhere(admin, "mailbox_connections", userId);

  // delegations.to_employee_id/to_run_id have no ON DELETE cascade (only
  // from_employee_id/from_run_id do), so it must be deleted explicitly
  // before employees/agent_runs or their deletes fail with an FK violation.
  await deleteWhere(admin, "delegations", userId);
  await deleteWhere(admin, "leads", userId);
  await deleteWhere(admin, "agent_run_steps", userId);
  await deleteWhere(admin, "agent_runs", userId);
  await deleteWhere(admin, "employees", userId);

  await deleteWhere(admin, "business_profiles", userId);
}

async function deleteWhere(
  admin: SupabaseClient,
  table: string,
  userId: string,
) {
  const { error } = await admin.from(table).delete().eq("user_id", userId);
  if (error) throw error;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
