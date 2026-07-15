import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import { getLatestRunWithLeads } from "@/lib/leads";
import { getAgentRunSteps } from "@/lib/agentRuns";
import type { IdRouteParams } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api/errors";

export async function GET(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;

  try {
    const { run, leads, researchedCount, passedCandidates } =
      await getLatestRunWithLeads(supabase, {
        userId: user.id,
        employeeId: employee.id,
      });
    const steps = run
      ? await getAgentRunSteps(supabase, { runId: run.id })
      : [];

    return NextResponse.json({
      run,
      leads,
      researchedCount,
      passedCandidates,
      steps,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
