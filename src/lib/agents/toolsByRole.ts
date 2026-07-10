import type { ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmployeeRole } from "@/lib/employees";
import { createDelegateToEmployeeTool, type DelegationRequest } from "./tools/delegationTool";
import { createSaveLeadTool } from "./tools/saveLeadTool";

/**
 * The tool set for a role's turn. Every role gets `delegate_to_employee`;
 * role-specific tools (Apollo search, save business profile, etc.) get
 * added here when that role's own work is tackled — this function is the
 * seam. See docs/AGENTS.md.
 */
export function getToolsForRole(
  role: EmployeeRole,
  ctx: {
    onDelegate: (request: DelegationRequest) => void;
    isRoleHired: (role: EmployeeRole) => boolean;
    supabase?: SupabaseClient;
    userId?: string;
    employeeId?: string;
    runId?: string;
  },
): ToolSet {
  const tools: ToolSet = {
    delegate_to_employee: createDelegateToEmployeeTool(ctx.onDelegate, ctx.isRoleHired),
  };

  if (role === "lead_sourcer" && ctx.supabase && ctx.userId && ctx.employeeId && ctx.runId) {
    tools.save_lead = createSaveLeadTool(ctx.supabase, {
      userId: ctx.userId,
      employeeId: ctx.employeeId,
      runId: ctx.runId,
    });
  }

  return tools;
}
