"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { EmployeeAvatar, Text } from "@/components/atoms";
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
};

const CHAT_OPENERS: Record<EmployeeRole, string> = {
  account_manager:
    "Hey, good to see you — anything new about the business, or something on your mind?",
  lead_sourcer: "Hey! Anything new I should know, or a question for me?",
  sales_representative:
    "Hey! Anything new I should know, or a question for me?",
};

export const EmployeeChatSidebar = ({ employeeId, role }: Props) => {
  const router = useRouter();
  const agentName = ROLE_LABELS[role];
  const [open, setOpen] = useState(true);
  const [justSaved, setJustSaved] = useState(false);

  const sendMessage = (messages: ChatMessage[]) =>
    sendKnowledgeChatMessage(employeeId, messages);

  const handleSave = async (messages: ChatMessage[]) => {
    const result = await applyKnowledgeRefresh(employeeId, messages);
    if (result) {
      router.refresh();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  return (
    <div
      className={`sticky top-(--header-height) z-30 flex h-[calc(100vh-var(--header-height))] shrink-0 flex-col overflow-hidden bg-(--surface) shadow-lg transition-[width] duration-300 ease-in-out ${
        open ? "w-96" : "w-14"
      }`}
    >
      {open ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-(--secondary-bg) p-4">
            <div className="flex items-center gap-2.5">
              <EmployeeAvatar seed={employeeId} size="sm" />
              <div>
                <Text size="sm" weight="medium">
                  {agentName}
                </Text>
                {justSaved && (
                  <Text size="xs" tone="muted">
                    Saved
                  </Text>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Collapse chat"
              className="rounded-full p-1.5 text-(--muted-faint) transition hover:bg-(--secondary-bg)"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <KnowledgeChatForm
              agentName={agentName}
              opener={CHAT_OPENERS[role]}
              sendMessage={sendMessage}
              onSave={handleSave}
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Talk to ${agentName}`}
          className="flex h-full w-14 flex-col items-center gap-2 pt-5 text-(--muted-faint) transition hover:bg-(--secondary-bg)"
        >
          <MessageCircle size={20} />
        </button>
      )}
    </div>
  );
};
