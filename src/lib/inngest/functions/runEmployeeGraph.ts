import type { ModelMessage } from "ai";
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEmployees, type EmployeeRole } from "@/lib/employees";
import { buildEmployeeGraph } from "@/lib/agents/graph";

/**
 * One Inngest job = one LangGraph delegation graph run, which may traverse
 * multiple employee nodes via handoffs. See docs/AGENTS.md.
 */
export const runEmployeeGraph = inngest.createFunction(
  { id: "run-employee-graph", triggers: [{ event: "employee/run.requested" }] },
  async ({ event, step }) => {
    const { userId, initiatingRole, message } = event.data as {
      userId: string;
      initiatingRole: EmployeeRole;
      message: string;
    };

    const supabase = createAdminClient();
    const employees = await listEmployees(supabase, userId);

    const employeeIdByRole: Partial<Record<EmployeeRole, string>> = {};
    for (const employee of employees) {
      employeeIdByRole[employee.role] = employee.id;
    }

    const graph = buildEmployeeGraph({
      supabase,
      userId,
      employeeIdByRole,
      initiatingRole,
    });

    const initialMessages: ModelMessage[] = [{ role: "user", content: message }];

    await step.run("run-graph", async () => {
      await graph.invoke(
        { messages: initialMessages },
        { recursionLimit: 6, configurable: { thread_id: crypto.randomUUID() } },
      );
    });

    return { status: "completed" };
  },
);
