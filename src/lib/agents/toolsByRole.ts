import type { ToolSet } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmployeeRole } from "@/lib/employees";
import { getWebSearchTool } from "./model";
import {
  createDelegateToEmployeeTool,
  type DelegationRequest,
} from "./tools/delegationTool";
import { createSaveLeadTool } from "./tools/saveLeadTool";
import { createSearchLeadsTool } from "./tools/searchLeadsTool";
import { createDraftOutreachTool } from "./tools/draftOutreachTool";
import { createDraftReplyTool } from "./tools/draftReplyTool";
import { createNotePassedCandidatesTool } from "./tools/notePassedCandidatesTool";
import { createAskAccountManagerTool } from "./tools/askAccountManagerTool";

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
  jobKind?: "outreach" | "reply";
  accountManagerEmployeeId?: string;
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
    note_passed_candidates: createNotePassedCandidatesTool(),
    ask_account_manager: createAskAccountManagerTool(ctx.supabase, {
      userId: ctx.userId,
      accountManagerEmployeeId: ctx.accountManagerEmployeeId,
      leadId: ctx.leadId,
    }),
  }),
  sales_representative: (ctx): ToolSet => {
    if (!ctx.leadId) return {};
    const askAccountManager = createAskAccountManagerTool(ctx.supabase, {
      userId: ctx.userId,
      accountManagerEmployeeId: ctx.accountManagerEmployeeId,
      leadId: ctx.leadId,
    });
    // Only one of these is ever exposed per run — never both. Both tools
    // write to the same lead row (draft vs. reply_draft), so surfacing both
    // whenever leadId is set would let the model call the wrong one for the
    // job it was actually briefed on (e.g. overwrite the outreach draft
    // mid-reply-run) since there's nothing else constraining its choice.
    if (ctx.jobKind === "reply") {
      return {
        draft_reply_email: createDraftReplyTool(ctx.supabase, {
          userId: ctx.userId,
          runId: ctx.runId,
          leadId: ctx.leadId,
        }),
        ask_account_manager: askAccountManager,
        web_search: getWebSearchTool(),
      };
    }
    return {
      draft_outreach_email: createDraftOutreachTool(ctx.supabase, {
        userId: ctx.userId,
        runId: ctx.runId,
        leadId: ctx.leadId,
      }),
      ask_account_manager: askAccountManager,
      web_search: getWebSearchTool(),
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
    delegate_to_employee: createDelegateToEmployeeTool(
      ctx.onDelegate,
      ctx.isRoleHired,
    ),
    ...roleTools[role](ctx),
  };
}
