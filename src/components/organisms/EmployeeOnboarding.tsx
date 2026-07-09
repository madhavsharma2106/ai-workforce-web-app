"use client";

import { useRouter } from "next/navigation";
import ConversationalForm, {
  type NextQuestionResult,
  type TranscriptEntry,
} from "@/components/organisms/ConversationalForm";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";

type Props = {
  employeeId: string;
  role: EmployeeRole;
};

const CONFIRM_LABELS: Record<EmployeeRole, string> = {
  account_manager: "Continue →",
  lead_sourcer: "Confirm hire →",
  sales_representative: "Confirm hire →",
};

const EmployeeOnboarding = ({ employeeId, role }: Props) => {
  const router = useRouter();

  const fetchNextQuestion = async (
    transcript: TranscriptEntry[],
  ): Promise<NextQuestionResult> => {
    const response = await fetch(
      `/api/employees/${employeeId}/onboarding-questions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      },
    );
    if (!response.ok) throw new Error("Failed to fetch next question.");
    return response.json();
  };

  const handleComplete = async (transcript: TranscriptEntry[]) => {
    const response = await fetch(
      `/api/employees/${employeeId}/complete-onboarding`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      },
    );
    const data = await response.json();
    if (!response.ok) return;

    if (data.day) {
      sessionStorage.setItem(`day:${employeeId}`, JSON.stringify(data.day));
    }
    router.push(data.redirectTo);
  };

  return (
    <ConversationalForm
      agentName={ROLE_LABELS[role]}
      confirmLabel={CONFIRM_LABELS[role]}
      fetchNextQuestion={fetchNextQuestion}
      onComplete={handleComplete}
    />
  );
};

export default EmployeeOnboarding;
