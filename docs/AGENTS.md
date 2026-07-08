# Agents

How a Role (see [ROLES.md](ROLES.md)) becomes a running employee — model access, system prompts, tools, delegation, and background execution. This covers the platform; each role's own tools and business logic are documented in that role's file under `roles/`, not here.

## Model access

All employees run on Anthropic Claude for MVP, via the Vercel AI SDK. The only place a provider package is imported is `src/lib/agents/model.ts` (`getModel()`) — every call site gets its model through this function, never by importing `@ai-sdk/anthropic` directly, so adding a second provider later is a change in one file, not a rewrite.

LangChain is deliberately not used — its chain/memory/agent-executor abstractions don't add anything over the AI SDK + plain SQL here, and LangChain's own team steers people toward LangGraph for agents now anyway. AI-SDK-specific calls are isolated behind `src/lib/agents/runTurn.ts`, and tool definitions are kept in the Zod-schema-plus-execute-function shape both AI SDK's and LangChain's `tool()` already share — so a future move to LangChain, if ever needed, is a rewrite of one module, not a redesign.

## System prompts

Loaded at request/job time from `roles/<role>.md` (`src/lib/roles.ts`) — git stays the source of truth, not the DB. `src/lib/agents/systemPrompt.ts` composes: the role file verbatim, the employee's display name (`ROLE_LABELS`), `business_profiles.profile_md`, the voice/tone rules from [UX.md](UX.md) (the model doesn't default to first-person, matter-of-fact, no-hedging on its own — it has to be told), and the role's Do Not list. Boundaries are enforced structurally where possible, not just by prompt — e.g. Lead Sourcer's "Do Not: Send emails" means no `send_email` tool is ever defined.

## Tools

Each role has a tool registry in `src/lib/agents/toolsByRole.ts` (`Record<EmployeeRole, Record<string, Tool>>`) — the seam for adding role-specific tools (Apollo search, save business profile, etc.) later without touching the runtime. Tools live in `src/lib/agents/tools/`, one file per concern. Every role currently gets `delegate_to_employee` (below); nothing else is built yet.

## Delegation — LangGraph.js

Employees hand work to each other through a LangGraph `StateGraph` (`src/lib/agents/graph.ts`), one node per role. A node loads its role's system prompt + tools and calls `runEmployeeTurn` (AI SDK) for its own reasoning/tool-calling — LangGraph only governs what happens *between* employees, not within one employee's turn.

Calling `delegate_to_employee` doesn't fire anything directly; it records a handoff request that the node wrapper turns into LangGraph's `Command({ goto: to_role, ... })`, routing execution to the target node within the same graph run. Cycles are bounded by LangGraph's `recursionLimit`. Each handoff is also logged to a `delegations` row (see [DATABASE.md](DATABASE.md)) as a framework-independent audit trail — LangGraph's own checkpoint history could technically reconstruct this, but it's serialized internal state meant for replay/debugging, not a stable, queryable product record.

**Optional debugging aid — LangSmith.** Since graph nodes are LangChain `Runnable`s under the hood, setting `LANGSMITH_TRACING=true` + `LANGSMITH_API_KEY` (see `.env.example`) automatically traces every `graph.invoke()` to the LangSmith dashboard — no code changes, purely opt-in, the app behaves identically with these unset. It shows node-by-node graph execution (which role ran, state in/out, timing), but **not** a breakdown of the underlying Claude call or tool arguments, since those run through the AI SDK (`runTurn.ts`), not a LangChain model wrapper. For that level of detail, use `agent_run_steps` (below) instead — it's the on-brand, product-appropriate view; LangSmith is a graph-topology debugging tool, not a replacement for it.

## Making work visible: "Thinking" and handoffs

No raw model reasoning is shown to users. Claude's extended-thinking mode isn't enabled, because its tone/verbosity can't be controlled to match [UX.md](UX.md)'s voice rules. Instead, "Thinking" (the UX.md term for this) is synthesized narration: `src/lib/agents/narration.ts` maps each tool name to `before`/`after` copy, written once when a step is persisted to `agent_run_steps.label`. Every new tool needs a narration entry or it falls back to a generic label — an ongoing authoring cost, not a one-time setup. A handoff's explanation comes from the model-written `reason` argument on `delegate_to_employee`, constrained by its schema description to read as something a client could see directly, not internal justification.

## Background execution — Inngest

Turn-based chat (a user actively talking to an employee) stays synchronous/streamed — one HTTP request per turn (`src/app/api/employees/[id]/chat/route.ts`, AI SDK `streamText` + `useChat`). Autonomous or multi-step work — anything that can involve a tool loop and/or a delegation — runs as a background job instead: one Inngest job = one LangGraph graph run, triggered by the `employee/run.requested` event (`src/lib/inngest/functions/runEmployeeGraph.ts`), with progress persisted to `agent_runs`/`agent_run_steps` and watched live via Supabase Realtime rather than polling or `sessionStorage`.

Inngest jobs run with no user session, so they use a service-role Supabase client (`src/lib/supabase/admin.ts`, server/job-only) that bypasses RLS — job code must filter every query by `user_id`/`employee_id` itself; nothing does this for it.

## Current status

This is platform infrastructure, not finished role behavior. The Account Manager has a real graph node; the Lead Sourcer and Sales Representative (see [roles/sales-representative.md](../roles/sales-representative.md)) nodes are stubs that prove handoff routing with no Apollo/lead logic or Outlook/send logic behind them yet — Oliver is hireable and routable via `delegate_to_employee` like Emma, but has no tools beyond the default handoff tool. Each role's actual tools, persistence, and UI land in that role's own follow-up pass — check `roles/<role>.md` for what a given role can actually do today versus what's planned.
