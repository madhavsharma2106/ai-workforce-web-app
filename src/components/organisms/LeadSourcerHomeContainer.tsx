import { createClient } from "@/lib/supabase/server";
import { getLatestRunWithLeads } from "@/lib/leads";
import LeadSourcerHome from "./LeadSourcerHome";

type Props = {
  employeeId: string;
  userId: string;
};

export default async function LeadSourcerHomeContainer({ employeeId, userId }: Props) {
  const { run, leads, researchedCount } = await getLatestRunWithLeads(
    await createClient(),
    { userId, employeeId },
  );

  return (
    <LeadSourcerHome
      employeeId={employeeId}
      initialRun={run}
      initialLeads={leads}
      initialResearchedCount={researchedCount}
    />
  );
}
