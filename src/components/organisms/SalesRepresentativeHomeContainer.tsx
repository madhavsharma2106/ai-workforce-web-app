import { createClient } from "@/lib/supabase/server";
import { getLeadsAwaitingOutreach } from "@/lib/leads";
import { getMailboxConnection } from "@/lib/mailboxConnections";
import { getActiveRunSteps, getEmployeeRunHistory } from "@/lib/agentRuns";
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
  const [leads, mailboxConnection, steps, history] = await Promise.all([
    getLeadsAwaitingOutreach(supabase, { userId }),
    getMailboxConnection(supabase, { userId }),
    getActiveRunSteps(supabase, { userId, employeeId }),
    getEmployeeRunHistory(supabase, { userId, employeeId }),
  ]);

  return (
    <SalesRepresentativeHome
      employeeId={employeeId}
      initialLeads={leads}
      mailboxConnected={mailboxConnection !== null}
      initialSteps={steps}
      history={history}
    />
  );
}
