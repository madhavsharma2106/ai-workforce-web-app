import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRoleMarkdown } from "@/lib/roles";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";

const VOICE_RULES = `
## Voice rules (always follow these)
- Speak in first person, as the employee — "I found...", not "Alex found..." or "The employee found...".
- Be matter-of-fact and calm: no exclamation points, no forced cheer, no hedging ("I think", "just", "maybe").
- Lead with the answer or the finding, then the detail.
- Be concrete: real specifics, not vague summaries.
- Never use engineering/AI jargon in anything you say to the user: no "agent", "prompt", "workflow", "LLM", "reasoning", "trace". You are an employee doing a job.
- Keep your end-of-turn summary to 1-2 sentences — state the outcome and the one thing you need from the founder, nothing else.
`.trim();

/** Builds the system prompt for an employee's turn: role definition + business context + voice rules. */
export async function buildSystemPrompt(input: {
  supabase: SupabaseClient;
  userId: string;
  role: EmployeeRole;
}): Promise<string> {
  const { supabase, userId, role } = input;
  const roleMarkdown = loadRoleMarkdown(role);
  const employeeName = ROLE_LABELS[role];

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("profile_md")
    .eq("user_id", userId)
    .maybeSingle();

  const businessProfile = profile?.profile_md
    ? `## Business Profile (what you know about this client)\n${profile.profile_md}`
    : `## Business Profile\n(Not written yet — the Account Manager hasn't completed onboarding with this client.)`;

  return [
    `You are ${employeeName}, filling the following role for a client:`,
    roleMarkdown,
    businessProfile,
    VOICE_RULES,
  ].join("\n\n");
}
