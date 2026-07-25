import type { ModelMessage } from "ai";
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmployeeRole } from "@/lib/employees";
import { runGraphJob } from "@/lib/agents/runGraphJob";
import { log } from "@/lib/log";

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
    const initialMessages: ModelMessage[] = [
      { role: "user", content: message },
    ];

    log.info("inngest job started", {
      job: "run-employee-graph",
      userId,
      initiatingRole,
    });

    await step.run("run-graph", async () => {
      await runGraphJob(supabase, {
        userId,
        initiatingRole,
        messages: initialMessages,
      });
    });

    log.info("inngest job finished", { job: "run-employee-graph", userId });

    return { status: "completed" };
  },
);
