import type { ToolSet } from "ai";
import type { EmployeeRole } from "@/lib/employees";
import { createDelegateToEmployeeTool, type DelegationRequest } from "./tools/delegationTool";

/**
 * The tool set for a role's turn. Every role gets `delegate_to_employee`;
 * role-specific tools (Apollo search, save business profile, etc.) get
 * added here when that role's own work is tackled — this function is the
 * seam. See docs/AGENTS.md.
 */
export function getToolsForRole(
  _role: EmployeeRole,
  ctx: {
    onDelegate: (request: DelegationRequest) => void;
    isRoleHired: (role: EmployeeRole) => boolean;
  },
): ToolSet {
  return {
    delegate_to_employee: createDelegateToEmployeeTool(ctx.onDelegate, ctx.isRoleHired),
  };
}
