import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getModel } from "@/lib/agents/model";
import { generateObject } from "@/lib/agents/tracing";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import { loadRoleMarkdown } from "@/lib/roles";
import { buildReferencedPageContext } from "@/lib/urlContext";

export type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  createdAt?: string;
};

export async function getChatMessages(
  supabase: SupabaseClient,
  employeeId: string,
): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("employee_chat_messages")
    .select("role, content, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: true });

  return (
    (data as
      | { role: "assistant" | "user"; content: string; created_at: string }[]
      | null) ?? []
  ).map(({ role, content, created_at }) => ({
    role,
    content,
    createdAt: created_at,
  }));
}

export async function saveChatMessage(
  supabase: SupabaseClient,
  employeeId: string,
  message: ChatMessage,
): Promise<void> {
  await supabase.from("employee_chat_messages").insert({
    employee_id: employeeId,
    role: message.role,
    content: message.content,
  });
}

const replySchema = z.object({ reply: z.string() });

const FALLBACK_REPLY =
  "Sorry, I'm having trouble right now — try again in a moment.";

const formatChatMessages = (messages: ChatMessage[]): string =>
  messages.length
    ? messages
        .map(
          (message) =>
            `${message.role === "assistant" ? "You" : "Founder"}: ${message.content}`,
        )
        .join("\n")
    : "(nothing said yet)";

/**
 * The chat transcript plus the content of any URL the founder has shared —
 * mirrors buildTranscriptContext in onboardingQuestions.ts but for free-form
 * chat messages instead of a strict Q/A transcript.
 */
export async function buildChatContext(
  messages: ChatMessage[],
): Promise<string> {
  const referencedPages = await buildReferencedPageContext(
    messages
      .filter((message) => message.role === "user")
      .map((message) => ({ prompt: "", answer: message.content })),
  );
  const base = formatChatMessages(messages);
  return referencedPages ? `${base}\n\n${referencedPages}` : base;
}

/**
 * Generates the agent's next free-form chat reply for the "Talk to {agent}"
 * feature — a natural conversation the founder can bring anything to, as
 * opposed to the one-question-at-a-time onboarding flow in
 * onboardingQuestions.ts. The founder decides when to save, so this never
 * signals "done" — it just keeps replying in character.
 */
export async function generateChatReply(input: {
  role: EmployeeRole;
  currentKnowledgeMd: string;
  knownProfile?: string | null;
  messages: ChatMessage[];
}): Promise<{ reply: string }> {
  const { role, currentKnowledgeMd, knownProfile, messages } = input;
  const agentName = ROLE_LABELS[role];
  const roleMarkdown = loadRoleMarkdown(role);
  const knownProfileText = knownProfile
    ? `\n\nExisting Business Profile on file for this founder:\n${knownProfile}`
    : "";
  const conversation = await buildChatContext(messages);

  const prompt = `You are ${agentName}, chatting with a founder who already onboarded you once. Here's what's on file for you specifically today:

${currentKnowledgeMd || "(nothing on file yet)"}${knownProfileText}

Follow the "## Onboarding" section below for the kind of things worth knowing and what "good" looks like for this role — treat it as background judgment, not a script to march through.

${roleMarkdown}

Conversation so far:
${conversation}

Reply as ${agentName}, in character, to the founder's latest message. This is a free-flowing chat, not an interview — respond to whatever they actually bring up, ask a natural follow-up only if it would genuinely sharpen your ability to do good work for them, and don't force the conversation back onto a checklist. Keep replies short and conversational (a sentence or two, occasionally a short list). Never re-ask something already covered above.`;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: replySchema,
      prompt,
    });
    return object;
  } catch {
    return { reply: FALLBACK_REPLY };
  }
}
