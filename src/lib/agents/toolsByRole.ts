import type { ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmployeeRole } from "@/lib/employees";
import { createDelegateToEmployeeTool, type DelegationRequest } from "./tools/delegationTool";
import { createSaveLeadTool } from "./tools/saveLeadTool";
import { createSearchLeadsTool } from "./tools/searchLeadsTool";
import { createDraftOutreachTool } from "./tools/draftOutreachTool";

/**
 * Context a role-specific tool factory needs. `supabase`/`userId`/`employeeId`/`runId`
 * are always populated by the time getToolsForRole is called (see graph.ts); only
 * `leadId` is genuinely optional, since it's only relevant to sales_representative.
 */
type RoleCtx = {
  supabase: SupabaseClient;
  userId: string;
  employeeId: string;
  runId: string;
  leadId?: string;
};

const roleTools: Record<EmployeeRole, (ctx: RoleCtx) => ToolSet> = {
  account_manager: () => ({}),
  lead_sourcer: (ctx) => ({
    search_leads: createSearchLeadsTool(ctx.supabase, {
      userId: ctx.userId,
      employeeId: ctx.employeeId,
    }),
    save_lead: createSaveLeadTool(ctx.supabase, {
      userId: ctx.userId,
      employeeId: ctx.employeeId,
      runId: ctx.runId,
    }),
  }),
  sales_representative: (ctx): ToolSet => {
    if (!ctx.leadId) return {};
    return {
      draft_outreach_email: createDraftOutreachTool(ctx.supabase, {
        userId: ctx.userId,
        runId: ctx.runId,
        leadId: ctx.leadId,
      }),
    };
  },
};

/**
 * The tool set for a role's turn. Every role gets `delegate_to_employee`;
 * role-specific tools come from the `roleTools` registry above. See docs/AGENTS.md.
 */
export function getToolsForRole(
  role: EmployeeRole,
  ctx: RoleCtx & {
    onDelegate: (request: DelegationRequest) => void;
    isRoleHired: (role: EmployeeRole) => boolean;
  },
): ToolSet {
  return {
    delegate_to_employee: createDelegateToEmployeeTool(ctx.onDelegate, ctx.isRoleHired),
    ...roleTools[role](ctx),
  };
}
