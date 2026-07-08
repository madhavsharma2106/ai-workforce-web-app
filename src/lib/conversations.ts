import type { SupabaseClient } from "@supabase/supabase-js";

export type Conversation = {
  id: string;
  user_id: string;
  employee_id: string;
  kind: "onboarding" | "chat";
  status: "active" | "completed";
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  user_id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool";
  parts: unknown;
  created_at: string;
};

export async function getOrCreateConversation(
  supabase: SupabaseClient,
  input: { userId: string; employeeId: string; kind: Conversation["kind"] },
): Promise<Conversation> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", input.userId)
    .eq("employee_id", input.employeeId)
    .eq("kind", input.kind)
    .eq("status", "active")
    .maybeSingle();

  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: input.userId, employee_id: input.employeeId, kind: input.kind })
    .select("*")
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function insertMessage(
  supabase: SupabaseClient,
  input: {
    userId: string;
    conversationId: string;
    role: Message["role"];
    parts: unknown;
  },
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    user_id: input.userId,
    conversation_id: input.conversationId,
    role: input.role,
    parts: input.parts,
  });
  if (error) throw error;
}

export async function listMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data as Message[] | null) ?? [];
}
