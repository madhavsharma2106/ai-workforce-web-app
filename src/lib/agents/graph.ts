import { StateGraph, START, END, Command, MemorySaver, Annotation } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelMessage } from "ai";
import { createEmployeeAgent } from "./runTurn";
import { buildSystemPrompt } from "./systemPrompt";
import { getToolsForRole } from "./toolsByRole";
import { narrateBefore } from "./narration";
import { createAgentRun, updateAgentRun, insertAgentRunStep, insertDelegation } from "@/lib/agentRuns";
import { getFeedbackContext } from "@/lib/leads";
import { searchPeople, type ApolloPerson } from "@/lib/integrations/apollo";
import { fetchCompanyText } from "@/lib/integrations/companyWebsite";
import { extractSearchKeywords } from "./leadSearchKeywords";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import type { DelegationRequest } from "./tools/delegationTool";

const CANDIDATE_CONCURRENCY = 4;
/** Lead Sourcer needs room for ~10 save_lead calls plus a wrap-up message. */
const LEAD_SOURCER_MAX_STEPS = 20;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function domainFromUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
}

function formatFeedbackBlock(feedback: Awaited<ReturnType<typeof getFeedbackContext>>): string {
  const lines: string[] = [];
  if (feedback.approvedCompanies.length) {
    lines.push(`Companies the client has approved before: ${feedback.approvedCompanies.join(", ")}.`);
  }
  if (feedback.rejected.length) {
    lines.push(
      "Companies the client rejected, with why:\n" +
        feedback.rejected.map((r) => `- ${r.company}${r.reason ? `: ${r.reason}` : ""}`).join("\n"),
    );
  }
  return lines.length ? lines.join("\n\n") : "(No prior feedback yet — this is an early run.)";
}

/**
 * Deterministic pre-fetch for the Lead Sourcer's turn: Apollo search + company
 * research have no judgment call in them, so they run as plain code before
 * the model's turn rather than as model-driven tool calls (keeps the
 * tool-loop step budget realistic — see docs/AGENTS.md). The model's actual
 * job, inside the traced turn, is to qualify each candidate and call
 * save_lead for the ones it's confident about.
 */
async function buildLeadSourcerBriefing(
  ctx: GraphContext,
  employeeId: string,
  runId: string,
  logStep: (input: { toolName: string; type: "tool_call" | "tool_result"; label: string; input?: unknown; output?: unknown }) => Promise<void>,
): Promise<string> {
  const { data: profile } = await ctx.supabase
    .from("business_profiles")
    .select("profile_md")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const profileMd: string = profile?.profile_md || "Small businesses that need outbound sales pipeline.";
  const feedback = await getFeedbackContext(ctx.supabase, { userId: ctx.userId, employeeId });

  // Apollo's search is a plain keyword match, not semantic — handing it the
  // whole multi-paragraph profile verbatim reliably returns zero results.
  const keywords = await extractSearchKeywords(profileMd);
  const people = await searchPeople({ icp: keywords });

  const seen = new Set(feedback.seenDomains);
  const candidates: ApolloPerson[] = [];
  for (const person of people) {
    if (!person.organization) continue;
    const domain = domainFromUrl(person.organization.primary_domain ?? person.organization.website_url ?? "");
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    candidates.push(person);
  }

  const searchLabel =
    people.length === 0
      ? `Searched for "${keywords}" — Apollo didn't return any matches.`
      : `Searching for companies that match your profile. Found ${people.length}, ${candidates.length} new since last time.`;

  await logStep({
    toolName: "search_leads",
    type: "tool_call",
    input: { icp: keywords },
    label: searchLabel,
  });

  const researched = await mapWithConcurrency(candidates, CANDIDATE_CONCURRENCY, async (person) => {
    const website = person.organization!.primary_domain ?? person.organization!.website_url ?? "";
    const page = website ? await fetchCompanyText(website) : null;
    return { person, website, page };
  });

  await logStep({
    toolName: "research_companies",
    type: "tool_result",
    output: { researched: researched.length },
    label: `Researched ${researched.length} ${researched.length === 1 ? "company" : "companies"}.`,
  });

  const packets = researched
    .map(({ person, website, page }, index) => {
      const decisionMaker = person.title ? `${person.name}, ${person.title}` : person.name;
      const researchText = page
        ? `Research from their site (${page.title || website}): ${page.text}`
        : "No usable research was available for this company's site — qualify conservatively and don't invent specifics about them.";
      const personIdNote = person.id ? ` [personId: ${person.id}]` : "";
      return `${index + 1}. ${person.organization!.name} (${website})\n   Decision maker: ${decisionMaker}${personIdNote}\n   ${researchText}`;
    })
    .join("\n\n");

  const noCandidatesReason =
    people.length === 0
      ? `(No candidates today — Apollo didn't return any matches for "${keywords}". Say so plainly and don't invent leads.)`
      : "(No new candidates today — everything Apollo returned had already been seen in a prior run.)";

  return [
    `Here are ${researched.length} candidate companies from today's search, each with either real research or a note that none was available:`,
    packets || noCandidatesReason,
    "## Experience — what's worked and what to avoid",
    formatFeedbackBlock(feedback),
    "For every company you judge genuinely qualified, call save_lead with a fit reason that cites something concrete from its research and a personalized draft outreach email. Skip candidates you're not confident about — don't call save_lead for them.",
  ].join("\n\n");
}

const ROLES: EmployeeRole[] = ["account_manager", "lead_sourcer", "sales_representative"];

const GraphState = Annotation.Root({
  messages: Annotation<ModelMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  // Last-value-wins: set by the source node on handoff, consumed by the
  // target node to link its run back to the originating `delegations` row.
  pendingDelegationId: Annotation<string | undefined>(),
});

type GraphContext = {
  supabase: SupabaseClient;
  userId: string;
  employeeIdByRole: Partial<Record<EmployeeRole, string>>;
  initiatingRole: EmployeeRole;
  runIdByRole: Partial<Record<EmployeeRole, string>>;
};

// KNOWN GAP: if a role is revisited within one graph run (e.g. A -> B -> A
// in a longer back-and-forth), this reuses the same agent_runs row rather
// than creating a new one per visit, and each node invocation's local `seq`
// counter (below) resets to 0 — so a revisit's agent_run_steps can collide
// on `seq` with the first visit's, and the run's summary reflects only the
// latest visit. Confirmed via live testing (2026-07-08); left as-is since it
// only affects extended multi-hop chains beyond this pass's scope, not the
// common one-hop handoff. Revisit if/when real work produces longer chains.
async function ensureRunForRole(ctx: GraphContext, role: EmployeeRole, employeeId: string): Promise<string> {
  const existing = ctx.runIdByRole[role];
  if (existing) return existing;

  const run = await createAgentRun(ctx.supabase, {
    userId: ctx.userId,
    employeeId,
    trigger: role === ctx.initiatingRole ? "manual" : "delegation",
  });
  ctx.runIdByRole[role] = run.id;
  return run.id;
}

function makeEmployeeNode(role: EmployeeRole, ctx: GraphContext) {
  return async (state: typeof GraphState.State) => {
    const employeeId = ctx.employeeIdByRole[role];
    if (!employeeId) {
      return new Command({ goto: END });
    }

    const isFirstTurnForRole = !ctx.runIdByRole[role];
    const runId = await ensureRunForRole(ctx, role, employeeId);
    if (isFirstTurnForRole && state.pendingDelegationId) {
      await ctx.supabase
        .from("delegations")
        .update({ to_run_id: runId, status: "accepted" })
        .eq("id", state.pendingDelegationId);
    }

    const systemPrompt = await buildSystemPrompt({ supabase: ctx.supabase, userId: ctx.userId, role });

    let delegationRequest: DelegationRequest | null = null;
    let seq = 0;
    const tools = getToolsForRole(role, {
      onDelegate: (request) => {
        delegationRequest = request;
      },
      isRoleHired: (target) => Boolean(ctx.employeeIdByRole[target]),
      supabase: ctx.supabase,
      userId: ctx.userId,
      employeeId,
      runId,
    });

    let turnMessages = state.messages;
    if (role === "lead_sourcer") {
      const briefing = await buildLeadSourcerBriefing(ctx, employeeId, runId, (entry) =>
        insertAgentRunStep(ctx.supabase, {
          userId: ctx.userId,
          runId,
          seq: seq++,
          type: entry.type,
          toolName: entry.toolName,
          input: entry.input,
          output: entry.output,
          label: entry.label,
        }).then(() => undefined),
      );
      turnMessages = [...state.messages, { role: "user", content: briefing }];
    }

    const agent = createEmployeeAgent({
      systemPrompt,
      tools,
      maxSteps: role === "lead_sourcer" ? LEAD_SOURCER_MAX_STEPS : undefined,
      metadata: { conversationKind: "delegation", role, runId, employeeId, userId: ctx.userId },
      onStepFinish: async (step) => {
        for (const call of step.toolCalls) {
          const input = (call as { input?: unknown }).input;
          await insertAgentRunStep(ctx.supabase, {
            userId: ctx.userId,
            runId,
            seq: seq++,
            type: "thinking",
            toolName: call.toolName,
            input,
            label: narrateBefore(call.toolName, (input ?? {}) as Record<string, unknown>),
          });
        }
        if (step.text) {
          await insertAgentRunStep(ctx.supabase, {
            userId: ctx.userId,
            runId,
            seq: seq++,
            type: "message",
            label: step.text,
          });
        }
      },
    });

    const result = await agent.generate({ messages: turnMessages });
    const newMessages = result.response.messages as unknown as ModelMessage[];

    await updateAgentRun(ctx.supabase, runId, {
      status: "completed",
      summary: result.text || undefined,
      completed_at: new Date().toISOString(),
    });

    if (state.pendingDelegationId) {
      await ctx.supabase
        .from("delegations")
        .update({ status: "completed" })
        .eq("id", state.pendingDelegationId);
    }

    if (delegationRequest) {
      const request = delegationRequest as DelegationRequest;
      const delegation = await insertDelegation(ctx.supabase, {
        userId: ctx.userId,
        fromEmployeeId: employeeId,
        toRole: request.to_role,
        toEmployeeId: ctx.employeeIdByRole[request.to_role],
        fromRunId: runId,
        reason: request.reason,
        context: request.context,
      });
      await insertAgentRunStep(ctx.supabase, {
        userId: ctx.userId,
        runId,
        seq: seq++,
        type: "delegation",
        label: `Handing this off to ${ROLE_LABELS[request.to_role]}.`,
        output: request,
      });

      // The target node gets a fresh briefing, not the source employee's raw
      // transcript — reusing it verbatim would (a) mislabel the source's
      // `assistant` turns as the target's own history, and (b) leave the
      // conversation ending on an `assistant` turn, which Claude rejects as
      // unsupported "message prefill" when generate() is called again.
      const handoffMessage: ModelMessage = {
        role: "user",
        content: `[Handed off from ${ROLE_LABELS[role]}] ${request.reason}${request.context ? ` Context: ${request.context}` : ""}`,
      };

      return new Command({
        update: { messages: [handoffMessage], pendingDelegationId: delegation.id },
        goto: request.to_role,
      });
    }

    return new Command({ update: { messages: newMessages }, goto: END });
  };
}

/**
 * Builds a fresh delegation graph for one run. Rebuilt per invocation (not a
 * shared singleton) since it closes over request-scoped context (the
 * initiating role, the run-id bookkeeping map). See docs/AGENTS.md.
 */
export function buildEmployeeGraph(input: {
  supabase: SupabaseClient;
  userId: string;
  employeeIdByRole: Partial<Record<EmployeeRole, string>>;
  initiatingRole: EmployeeRole;
}) {
  const ctx: GraphContext = { ...input, runIdByRole: {} };

  const builder = new StateGraph(GraphState);
  for (const role of ROLES) {
    // Each node's Command can dynamically route to any other role (a
    // handoff) or END — LangGraph needs these declared for its static
    // reachability check at compile time, since it can't see the runtime
    // `goto` value otherwise.
    const ends = [...ROLES.filter((r) => r !== role), END];
    builder.addNode(role, makeEmployeeNode(role, ctx), { ends: ends as never[] });
  }
  builder.addEdge(START, ctx.initiatingRole as never);

  return builder.compile({ checkpointer: new MemorySaver() });
}
