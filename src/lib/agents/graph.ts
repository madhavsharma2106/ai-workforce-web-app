import { StateGraph, START, END, Command, MemorySaver, Annotation } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelMessage } from "ai";
import { createEmployeeAgent } from "./runTurn";
import { buildSystemPrompt } from "./systemPrompt";
import { getToolsForRole } from "./toolsByRole";
import { narrateBefore, narrateAfter } from "./narration";
import { createAgentRun, updateAgentRun, insertAgentRunStep, insertDelegation } from "@/lib/agentRuns";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import type { DelegationRequest } from "./tools/delegationTool";

/** Lead Sourcer needs room for ~10 save_lead calls, a note_passed_candidates call per search, and a wrap-up message. */
const LEAD_SOURCER_MAX_STEPS = 24;

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
  // Fixed for the whole job (one lead per Oliver-drafting job) — context
  // level, not graph state, since it never changes mid-run.
  leadId?: string;
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

    const systemPrompt = await buildSystemPrompt({
      supabase: ctx.supabase,
      userId: ctx.userId,
      role,
      employeeId,
    });

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
      leadId: ctx.leadId,
    });

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
        for (const toolResult of step.toolResults) {
          const input = (toolResult as { input?: unknown }).input;
          const output = (toolResult as { output?: unknown }).output;
          const label = narrateAfter(toolResult.toolName, (input ?? {}) as Record<string, unknown>, output);
          if (!label) continue;
          await insertAgentRunStep(ctx.supabase, {
            userId: ctx.userId,
            runId,
            seq: seq++,
            type: "tool_result",
            toolName: toolResult.toolName,
            output,
            label,
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

    const result = await agent.generate({ messages: state.messages });
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
  leadId?: string;
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
