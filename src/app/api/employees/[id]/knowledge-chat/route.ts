import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import {
  generateChatReply,
  getChatMessages,
  saveChatMessage,
} from "@/lib/knowledgeChat";
import type { IdRouteParams } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api/errors";

export async function POST(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;

  try {
    const body = await request.json();
    const message: string = body.message ?? "";

    await saveChatMessage(supabase, id, { role: "user", content: message });
    const messages = await getChatMessages(supabase, id);

    const { data: businessProfile } = await supabase
      .from("business_profiles")
      .select("profile_md")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentKnowledgeMd =
      employee.role === "account_manager"
        ? businessProfile?.profile_md || ""
        : employee.instructions_md || "";

    const next = await generateChatReply({
      role: employee.role,
      currentKnowledgeMd,
      knownProfile:
        employee.role === "account_manager"
          ? null
          : businessProfile?.profile_md || null,
      messages,
    });

    await saveChatMessage(supabase, id, {
      role: "assistant",
      content: next.reply,
    });

    return NextResponse.json(next);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
