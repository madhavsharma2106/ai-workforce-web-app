"use client";

import { Heading, Modal, Text } from "@/components/atoms";
import ConversationalForm, {
  type NextQuestionResult,
  type TranscriptEntry,
} from "@/components/organisms/ConversationalForm";
import type { EmployeeRole } from "@/lib/employees";

export type KnowledgeRefreshResult =
  | { instructionsMd: string }
  | {
      businessProfile: {
        businessName: string;
        contactName: string;
        profileMd: string;
        updatedAt?: string;
      };
    };

type Props = {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  role: EmployeeRole;
  agentName: string;
  onApplied: (result: KnowledgeRefreshResult) => void;
};

const KnowledgeRefreshModal = ({
  open,
  onClose,
  employeeId,
  agentName,
  onApplied,
}: Props) => {
  const fetchNextQuestion = async (
    transcript: TranscriptEntry[],
  ): Promise<NextQuestionResult> => {
    const response = await fetch(`/api/employees/${employeeId}/knowledge-gaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!response.ok) throw new Error("Failed to check for gaps.");
    return response.json();
  };

  const handleComplete = async (transcript: TranscriptEntry[]) => {
    const response = await fetch(
      `/api/employees/${employeeId}/apply-knowledge-refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      },
    );
    const data = await response.json();
    if (response.ok) onApplied(data as KnowledgeRefreshResult);
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Heading as="h3" size="sm">
            {agentName} is checking for gaps
          </Heading>
          <Text size="sm" tone="muted" className="mt-1">
            Reviewing what&apos;s already on file and asking about anything missing.
          </Text>
        </div>
        <ConversationalForm
          agentName={agentName}
          confirmLabel="Save updates"
          fetchNextQuestion={fetchNextQuestion}
          onComplete={handleComplete}
        />
      </div>
    </Modal>
  );
};

export default KnowledgeRefreshModal;
