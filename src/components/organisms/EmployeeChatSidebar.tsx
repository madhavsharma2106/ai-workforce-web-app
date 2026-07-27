"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { EmployeeAvatar, Heading, Text } from "@/components/atoms";
import { KnowledgeChatForm } from "./KnowledgeChatForm";
import {
  applyKnowledgeRefresh,
  sendKnowledgeChatMessage,
} from "@/lib/api/employees";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import type { ChatMessage } from "@/lib/knowledgeChat";

type Props = {
  employeeId: string;
  role: EmployeeRole;
  initialMessages: ChatMessage[];
};

const CHAT_OPENERS: Record<EmployeeRole, string> = {
  account_manager:
    "Hey, good to see you — anything new about the business, or something on your mind?",
  lead_sourcer: "Hey! Anything new I should know, or a question for me?",
  sales_representative:
    "Hey! Anything new I should know, or a question for me?",
};

export const EmployeeChatSidebar = ({
  employeeId,
  role,
  initialMessages,
}: Props) => {
  const router = useRouter();
  const agentName = ROLE_LABELS[role];
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const sendMessage = (message: string) =>
    sendKnowledgeChatMessage(employeeId, message);

  const handleSave = async () => {
    const result = await applyKnowledgeRefresh(employeeId);
    if (result) {
      router.refresh();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  return (
    <div
      className={`fixed right-6 bottom-0 z-30 flex w-96 shrink-0 flex-col overflow-hidden rounded-t-xl border border-b-0 border-(--border) bg-(--surface) shadow-2xl transition-[height] duration-200 ease-in-out ${
        open ? "h-[min(38rem,calc(100vh-5rem))]" : "h-17.25"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Collapse chat" : `Talk to ${agentName}`}
        className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border) p-4 text-left transition hover:bg-(--secondary-bg)"
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <EmployeeAvatar seed={employeeId} size="sm" />
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-(--surface) bg-(--accent)" />
          </div>
          <div>
            <Heading as="h3" size="sm">
              {agentName}
            </Heading>
            <Text size="xs" tone="muted">
              {justSaved ? "Saved" : "Active now"}
            </Text>
          </div>
        </div>
        <span className="rounded-full p-1.5 text-(--muted-faint)">
          {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </span>
      </button>
      {open && (
        <div className="min-h-0 flex-1">
          <KnowledgeChatForm
            employeeId={employeeId}
            agentName={agentName}
            opener={CHAT_OPENERS[role]}
            initialMessages={initialMessages}
            sendMessage={sendMessage}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  );
};
