"use client";

import { Heading, Modal, Text } from "@/components/atoms";
import { KnowledgeChatForm } from "./KnowledgeChatForm";
import {
  applyKnowledgeRefresh,
  sendKnowledgeChatMessage,
  type KnowledgeRefreshResult,
} from "@/lib/api/employees";
import type { EmployeeRole } from "@/lib/employees";
import type { ChatMessage } from "@/lib/knowledgeChat";

export type { KnowledgeRefreshResult };

type Props = {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  role: EmployeeRole;
  agentName: string;
  onApplied: (result: KnowledgeRefreshResult) => void;
};

const CHAT_OPENERS: Record<EmployeeRole, string> = {
  account_manager:
    "Hey, good to see you — anything new about the business, or something on your mind?",
  lead_sourcer: "Hey! Anything new I should know, or a question for me?",
  sales_representative:
    "Hey! Anything new I should know, or a question for me?",
};

export const KnowledgeRefreshModal = ({
  open,
  onClose,
  employeeId,
  role,
  agentName,
  onApplied,
}: Props) => {
  const sendMessage = (messages: ChatMessage[]) =>
    sendKnowledgeChatMessage(employeeId, messages);

  const handleSave = async (messages: ChatMessage[]) => {
    const result = await applyKnowledgeRefresh(employeeId, messages);
    if (result) onApplied(result);
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Heading as="h3" size="sm">
            Catching up with {agentName}
          </Heading>
          <Text size="sm" tone="muted" className="mt-1">
            Chat about anything new — I&apos;ll fold it into what I know when
            you save.
          </Text>
        </div>
        <KnowledgeChatForm
          agentName={agentName}
          opener={CHAT_OPENERS[role]}
          sendMessage={sendMessage}
          onSave={handleSave}
        />
      </div>
    </Modal>
  );
};
