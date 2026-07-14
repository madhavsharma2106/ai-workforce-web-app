import { createClient } from "@/lib/supabase/server";
import { getLatestRunWithLeads, getRunHistory } from "@/lib/leads";
import { getAgentRunSteps } from "@/lib/agentRuns";
import { listEmployees } from "@/lib/employees";
import LeadSourcerHome from "./LeadSourcerHome";

type Props = {
  employeeId: string;
  userId: string;
};

export default async function LeadSourcerHomeContainer({ employeeId, userId }: Props) {
  const supabase = await createClient();
  const [{ run, leads, researchedCount, passedCandidates }, employees] = await Promise.all([
    getLatestRunWithLeads(supabase, { userId, employeeId }),
    listEmployees(supabase, userId),
  ]);
  const [history, steps] = await Promise.all([
    getRunHistory(supabase, { userId, employeeId, excludeRunId: run?.id }),
    run ? getAgentRunSteps(supabase, { runId: run.id }) : Promise.resolve([]),
  ]);
  const self = employees.find((e) => e.id === employeeId);
  const accountManager = employees.find((e) => e.role === "account_manager");

  return (
    <LeadSourcerHome
      employeeId={employeeId}
      initialRun={run}
      initialLeads={leads}
      initialResearchedCount={researchedCount}
      initialSteps={steps}
      initialHistory={history}
      initialPassedCandidates={passedCandidates}
      initialInstructionsMd={self?.instructions_md ?? null}
      accountManagerId={accountManager?.id ?? null}
      oliverHired={employees.some((e) => e.role === "sales_representative")}
    />
  );
}
