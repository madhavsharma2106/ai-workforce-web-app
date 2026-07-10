import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployee, ROLE_LABELS } from "@/lib/employees";
import { getAgentRun, getAgentRunSteps } from "@/lib/agentRuns";
import { getLeadsByRunId } from "@/lib/leads";
import { Breadcrumb } from "@/components/atoms";
import TaskDetail from "@/components/organisms/TaskDetail";

type Params = { params: Promise<{ id: string; runId: string }> };

export default async function TaskDetailPage({ params }: Params) {
  const { id, runId } = await params;
  const supabase = await createClient();
  const { user, employee } = await requireOwnedEmployee(supabase, id);

  const run = await getAgentRun(supabase, {
    userId: user.id,
    employeeId: employee.id,
    runId,
  });
  if (!run) notFound();

  const [steps, leads] = await Promise.all([
    getAgentRunSteps(supabase, { runId }),
    getLeadsByRunId(supabase, { runId }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: ROLE_LABELS[employee.role], href: `/employee/${employee.id}` },
          { label: "Task" },
        ]}
      />
      <TaskDetail employeeId={employee.id} run={run} steps={steps} leads={leads} />
    </div>
  );
}
