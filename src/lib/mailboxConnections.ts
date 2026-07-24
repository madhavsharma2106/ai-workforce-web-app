import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/integrations/email/registry";
import type {
  EmailMessage,
  EmailProvider,
} from "@/lib/integrations/email/types";

export type MailboxConnection = {
  id: string;
  provider: string;
  email: string;
};

export async function getMailboxConnection(
  supabase: SupabaseClient,
  input: { userId: string },
): Promise<MailboxConnection | null> {
  const { data } = await supabase
    .from("mailbox_connections")
    .select("id, provider, email")
    .eq("user_id", input.userId)
    .maybeSingle();
  return (data as MailboxConnection | null) ?? null;
}

/**
 * Writes the row via the caller's session-scoped client (so RLS still
 * governs it), but reaches for the admin client just for the Vault RPCs —
 * `create_mailbox_secret` revokes execute from authenticated/anon, so
 * there's no other way to write a secret. A re-connect deletes the prior
 * secret first so it doesn't linger in Vault after being superseded.
 */
export async function upsertMailboxConnection(
  supabase: SupabaseClient,
  input: {
    userId: string;
    provider: string;
    email: string;
    credentials: unknown;
  },
): Promise<void> {
  const admin = createAdminClient();

  const { data: existing } = await supabase
    .from("mailbox_connections")
    .select("credentials_secret_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing) {
    await admin.rpc("delete_mailbox_secret", {
      secret_id: existing.credentials_secret_id,
    });
  }

  const { data: secretId, error: secretError } = await admin.rpc(
    "create_mailbox_secret",
    {
      secret: JSON.stringify(input.credentials),
      secret_name: `mailbox_connection:${input.userId}`,
    },
  );
  if (secretError) throw secretError;

  const { error } = await supabase.from("mailbox_connections").upsert(
    {
      user_id: input.userId,
      provider: input.provider,
      email: input.email,
      credentials_secret_id: secretId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function deleteMailboxConnection(
  supabase: SupabaseClient,
  input: { userId: string },
): Promise<void> {
  const { data: existing } = await supabase
    .from("mailbox_connections")
    .select("credentials_secret_id")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!existing) return;

  const admin = createAdminClient();
  await admin.rpc("delete_mailbox_secret", {
    secret_id: existing.credentials_secret_id,
  });

  const { error } = await supabase
    .from("mailbox_connections")
    .delete()
    .eq("user_id", input.userId);
  if (error) throw error;
}

/**
 * Loads the founder's mailbox connection, refreshing credentials first if
 * the provider says they're near expiry (persisting the refresh back to
 * Vault before returning them). Shared by every action that needs a live
 * provider + credentials — sending, saving a draft, and anything added later.
 */
async function loadConnection(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ provider: EmailProvider; credentials: unknown }> {
  const { data: connection } = await supabase
    .from("mailbox_connections")
    .select("provider, credentials_secret_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!connection) throw new Error("No mailbox connected for this founder.");

  const provider = getEmailProvider(connection.provider);
  const admin = createAdminClient();

  const { data: secretText, error: readError } = await admin.rpc(
    "read_mailbox_secret",
    {
      secret_id: connection.credentials_secret_id,
    },
  );
  if (readError) throw readError;
  let credentials: unknown = JSON.parse(secretText as string);

  if (provider.refreshIfNeeded) {
    const refreshed = await provider.refreshIfNeeded(credentials);
    if (refreshed) {
      credentials = refreshed;
      await admin.rpc("update_mailbox_secret", {
        secret_id: connection.credentials_secret_id,
        new_secret: JSON.stringify(credentials),
      });
    }
  }

  return { provider, credentials };
}

export async function sendViaConnection(
  supabase: SupabaseClient,
  userId: string,
  message: EmailMessage,
): Promise<void> {
  const { provider, credentials } = await loadConnection(supabase, userId);
  await provider.sendMail(credentials, message);
}

export async function saveDraftViaConnection(
  supabase: SupabaseClient,
  userId: string,
  message: EmailMessage,
): Promise<void> {
  const { provider, credentials } = await loadConnection(supabase, userId);
  if (!provider.saveDraft) {
    throw new Error("This mailbox provider doesn't support saving drafts.");
  }
  await provider.saveDraft(credentials, message);
}
