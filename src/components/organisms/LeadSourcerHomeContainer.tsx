import { createClient } from "@/lib/supabase/server";
import { getLatestRunWithLeads, getRunHistory } from "@/lib/leads";
import LeadSourcerHome from "./LeadSourcerHome";

type Props = {
  employeeId: string;
  userId: string;
};

export default async function LeadSourcerHomeContainer({ employeeId, userId }: Props) {
  const supabase = await createClient();
  const { run, leads, researchedCount } = await getLatestRunWithLeads(supabase, {
    userId,
    employeeId,
  });
  const history = await getRunHistory(supabase, {
    userId,
    employeeId,
    excludeRunId: run?.id,
  });

  return (
    <LeadSourcerHome
      employeeId={employeeId}
      initialRun={run}
      initialLeads={leads}
      initialResearchedCount={researchedCount}
      initialHistory={history}
    />
  );
}
