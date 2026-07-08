import { readFileSync } from "node:fs";
import path from "node:path";
import type { EmployeeRole } from "@/lib/employees";

const ROLE_FILES: Record<EmployeeRole, string> = {
  account_manager: "account-manager.md",
  lead_sourcer: "lead-sourcer.md",
};

const cache = new Map<EmployeeRole, string>();

/** Loads a role's job definition from `roles/<role>.md`. Git is the source of truth — see docs/ROLES.md. */
export function loadRoleMarkdown(role: EmployeeRole): string {
  const cached = cache.get(role);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "roles", ROLE_FILES[role]);
  const contents = readFileSync(filePath, "utf-8");
  cache.set(role, contents);
  return contents;
}
