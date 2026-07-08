import { NextResponse } from "next/server";
import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById } from "@/lib/employees";
import { buildSystemPrompt } from "@/lib/agents/systemPrompt";
import { createEmployeeAgent } from "@/lib/agents/runTurn";
import { getOrCreateConversation, insertMessage, listMessages } from "@/lib/conversations";

type Params = { params: Promise<{ id: string }> };

async function requireOwnedEmployee(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const employee = await getEmployeeById(supabase, id);
  if (!employee || employee.user_id !== user.id) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { supabase, user, employee };
}

/**
 * Turn-based chat with an employee — synchronous/streamed per turn, distinct
 * from the background LangGraph delegation graph. See docs/AGENTS.md.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await requireOwnedEmployee(id);
  if ("error" in result) return result.error;
  const { supabase, user } = result;

  const conversation = await getOrCreateConversation(supabase, {
    userId: user.id,
    employeeId: id,
    kind: "chat",
  });
  const messages = await listMessages(supabase, conversation.id);

  return NextResponse.json({
    messages: messages.map((m) => ({ id: m.id, role: m.role, parts: m.parts })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await requireOwnedEmployee(id);
  if ("error" in result) return result.error;
  const { supabase, user, employee } = result;

  const { messages }: { messages: UIMessage[] } = await request.json();
  const conversation = await getOrCreateConversation(supabase, {
    userId: user.id,
    employeeId: id,
    kind: "chat",
  });

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    await insertMessage(supabase, {
      userId: user.id,
      conversationId: conversation.id,
      role: "user",
      parts: lastMessage.parts,
    });
  }

  const systemPrompt = await buildSystemPrompt({ supabase, userId: user.id, role: employee.role });
  const agent = createEmployeeAgent({ systemPrompt, tools: {} });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    onFinish: async ({ responseMessage }) => {
      await insertMessage(supabase, {
        userId: user.id,
        conversationId: conversation.id,
        role: "assistant",
        parts: responseMessage.parts,
      });
    },
  });
}
