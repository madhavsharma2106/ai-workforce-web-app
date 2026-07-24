import { createClient } from "@/lib/supabase/server";
import { getLeadsAwaitingOutreach } from "@/lib/leads";
import { getMailboxConnection } from "@/lib/mailboxConnections";
import { SalesRepresentativeHome } from "./SalesRepresentativeHome";

type Props = {
  employeeId: string;
  userId: string;
};

export async function SalesRepresentativeHomeContainer({
  employeeId,
  userId,
}: Props) {
  const supabase = await createClient();
  const [leads, mailboxConnection] = await Promise.all([
    getLeadsAwaitingOutreach(supabase, { userId }),
    getMailboxConnection(supabase, { userId }),
  ]);

  return (
    <SalesRepresentativeHome
      employeeId={employeeId}
      initialLeads={leads}
      mailboxConnected={mailboxConnection !== null}
    />
  );
}
