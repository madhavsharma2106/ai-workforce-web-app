"use client";

import { useRouter } from "next/navigation";
import ConversationalForm, {
  ConversationalFormQuestion,
} from "@/components/organisms/ConversationalForm";
import type { EmployeeRole } from "@/lib/employees";

type Props = {
  employeeId: string;
  role: EmployeeRole;
};

// Alex's initial question set — she'll ask more as the Business Profile
// deepens; this isn't meant to be the final list.
const accountManagerQuestions: ConversationalFormQuestion[] = [
  {
    key: "idealClient",
    prompt:
      "Hi, I'm Alex — I'll make sure everyone you hire understands your business. First: what does your ideal client look like?",
    placeholder: "e.g. B2B SaaS companies with weak video presence...",
  },
  {
    key: "badLeadCriteria",
    prompt: "And what should we steer clear of — what's a bad-fit lead?",
    placeholder: "e.g. Agencies, consumer brands, companies too small...",
  },
  {
    key: "name",
    prompt: "Last thing — what should I call you?",
    placeholder: "Your name (optional)",
    optional: true,
  },
];

// Placeholder only — Emma will ask her own questions (lead-type
// preferences, etc.) once that content is designed.
const leadSourcerQuestions: ConversationalFormQuestion[] = [
  {
    key: "notes",
    prompt:
      "Hi, I'm Emma — I'll be sourcing leads and drafting outreach for you. Anything I should know before I start?",
    placeholder: "Optional — anything you'd like me to know",
    optional: true,
  },
];

const EmployeeOnboarding = ({ employeeId, role }: Props) => {
  const router = useRouter();

  const questions =
    role === "account_manager"
      ? accountManagerQuestions
      : leadSourcerQuestions;
  const agentName = role === "account_manager" ? "Alex" : "Emma";
  const confirmLabel =
    role === "account_manager" ? "Continue →" : "Confirm hire →";

  const handleComplete = async (answers: Record<string, string>) => {
    const response = await fetch(
      `/api/employees/${employeeId}/complete-onboarding`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
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
      agentName={agentName}
      questions={questions}
      confirmLabel={confirmLabel}
      onComplete={handleComplete}
    />
  );
};

export default EmployeeOnboarding;
