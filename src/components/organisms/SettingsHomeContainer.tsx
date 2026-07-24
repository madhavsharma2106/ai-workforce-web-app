import { createClient } from "@/lib/supabase/server";
import { getMailboxConnection } from "@/lib/mailboxConnections";
import { SettingsHome } from "./SettingsHome";

type Props = {
  userId: string;
};

export async function SettingsHomeContainer({ userId }: Props) {
  const supabase = await createClient();
  const connection = await getMailboxConnection(supabase, { userId });

  return <SettingsHome connection={connection} />;
}
