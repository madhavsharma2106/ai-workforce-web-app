import { createClient } from "@/lib/supabase/server";
import {
  getLatestRunWithLeads,
  getLearningsSummary,
  getRunHistory,
} from "@/lib/leads";
import { getAgentRunSteps } from "@/lib/agentRuns";
import { listEmployees } from "@/lib/employees";
import { LeadSourcerHome } from "./LeadSourcerHome";

type Props = {
  employeeId: string;
  userId: string;
};

export async function LeadSourcerHomeContainer({ employeeId, userId }: Props) {
  const supabase = await createClient();
  const [{ run, leads, researchedCount, passedCandidates }, employees] =
    await Promise.all([
      getLatestRunWithLeads(supabase, { userId, employeeId }),
      listEmployees(supabase, userId),
    ]);
  const [history, steps, learnings] = await Promise.all([
    getRunHistory(supabase, { userId, employeeId, excludeRunId: run?.id }),
    run ? getAgentRunSteps(supabase, { runId: run.id }) : Promise.resolve([]),
    getLearningsSummary(supabase, { userId, employeeId }),
  ]);
  return (
    <LeadSourcerHome
      employeeId={employeeId}
      initialRun={run}
      initialLeads={leads}
      initialResearchedCount={researchedCount}
      initialSteps={steps}
      initialHistory={history}
      initialPassedCandidates={passedCandidates}
      learnings={learnings}
      oliverHired={employees.some((e) => e.role === "sales_representative")}
    />
  );
}
