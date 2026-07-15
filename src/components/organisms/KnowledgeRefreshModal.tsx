"use client";

import { Heading, Modal, Text } from "@/components/atoms";
import ConversationalForm, {
  type NextQuestionResult,
  type TranscriptEntry,
} from "@/components/organisms/ConversationalForm";
import { applyKnowledgeRefresh, fetchKnowledgeGapQuestion, type KnowledgeRefreshResult } from "@/lib/api/employees";
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

const KnowledgeRefreshModal = ({
  open,
  onClose,
  employeeId,
  agentName,
  onApplied,
}: Props) => {
  const fetchNextQuestion = async (
    transcript: TranscriptEntry[],
  ): Promise<NextQuestionResult> => fetchKnowledgeGapQuestion(employeeId, transcript);

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
