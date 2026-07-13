import { createClient } from "@/lib/supabase/server";
import { getLatestRunWithLeads, getRunHistory } from "@/lib/leads";
import { listEmployees } from "@/lib/employees";
import LeadSourcerHome from "./LeadSourcerHome";

type Props = {
  employeeId: string;
  userId: string;
};

export default async function LeadSourcerHomeContainer({ employeeId, userId }: Props) {
  const supabase = await createClient();
  const [{ run, leads, researchedCount }, employees] = await Promise.all([
    getLatestRunWithLeads(supabase, { userId, employeeId }),
    listEmployees(supabase, userId),
  ]);
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
      oliverHired={employees.some((e) => e.role === "sales_representative")}
    />
  );
}
