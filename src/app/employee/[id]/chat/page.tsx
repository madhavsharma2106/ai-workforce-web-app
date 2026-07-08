import { notFound, redirect } from "next/navigation";
import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById, ROLE_LABELS } from "@/lib/employees";
import { getOrCreateConversation, listMessages } from "@/lib/conversations";
import { Eyebrow, Heading } from "@/components/atoms";
import AppHeader from "@/components/organisms/AppHeader";
import TestChat from "@/components/organisms/TestChat";

type Params = { params: Promise<{ id: string }> };

/** Minimal test harness for the chat plumbing — see docs/AGENTS.md. */
export default async function EmployeeChatPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const employee = await getEmployeeById(supabase, id);
  if (!employee || employee.user_id !== user.id) {
    notFound();
  }

  const conversation = await getOrCreateConversation(supabase, {
    userId: user.id,
    employeeId: id,
    kind: "chat",
  });
  const messages = await listMessages(supabase, conversation.id);
  const initialMessages: UIMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage["role"],
    parts: m.parts as UIMessage["parts"],
  }));

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <AppHeader />
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <div>
          <Eyebrow>Test chat</Eyebrow>
          <Heading as="h1" size="lg" className="mt-1">
            Chat with {ROLE_LABELS[employee.role]}
          </Heading>
        </div>
        <TestChat
          employeeId={employee.id}
          employeeName={ROLE_LABELS[employee.role]}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
