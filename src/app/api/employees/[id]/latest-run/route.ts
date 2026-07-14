import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import { getLatestRunWithLeads } from "@/lib/leads";
import { getAgentRunSteps } from "@/lib/agentRuns";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;

  const { run, leads, researchedCount, passedCandidates } = await getLatestRunWithLeads(supabase, {
    userId: user.id,
    employeeId: employee.id,
  });
  const steps = run ? await getAgentRunSteps(supabase, { runId: run.id }) : [];

  return NextResponse.json({ run, leads, researchedCount, passedCandidates, steps });
}
