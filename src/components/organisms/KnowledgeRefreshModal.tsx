"use client";

import { Heading, Modal, Text } from "@/components/atoms";
import {
  ConversationalForm,
  type NextQuestionResult,
  type TranscriptEntry,
} from "./ConversationalForm";
import {
  applyKnowledgeRefresh,
  fetchKnowledgeGapQuestion,
  type KnowledgeRefreshResult,
} from "@/lib/api/employees";
import type { EmployeeRole } from "@/lib/employees";

export type { KnowledgeRefreshResult };

type Props = {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  role: EmployeeRole;
  agentName: string;
  onApplied: (result: KnowledgeRefreshResult) => void;
};

export const KnowledgeRefreshModal = ({
  open,
  onClose,
  employeeId,
  agentName,
  onApplied,
}: Props) => {
  const fetchNextQuestion = async (
    transcript: TranscriptEntry[],
  ): Promise<NextQuestionResult> =>
    fetchKnowledgeGapQuestion(employeeId, transcript);

  const handleComplete = async (transcript: TranscriptEntry[]) => {
    const result = await applyKnowledgeRefresh(employeeId, transcript);
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
            Picking up where we left off — I&apos;ll ask about anything that
            would help me get to know your business better.
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
