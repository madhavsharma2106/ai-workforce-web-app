import type { NextQuestionResult, OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";
import type { AgentRun, AgentRunStep, Lead, PassedCandidate } from "@/lib/types";

export type LatestRunResponse = {
  run: AgentRun | null;
  leads: Lead[];
  researchedCount: number;
  passedCandidates: PassedCandidate[];
  steps: AgentRunStep[];
};

export async function getLatestRun(employeeId: string): Promise<LatestRunResponse | null> {
  const response = await fetch(`/api/employees/${employeeId}/latest-run`);
  if (!response.ok) return null;
  return response.json();
}

export async function triggerRun(employeeId: string, message: string): Promise<void> {
  await fetch(`/api/employees/${employeeId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function getDrafts(employeeId: string): Promise<{ leads: Lead[] } | null> {
  const response = await fetch(`/api/employees/${employeeId}/drafts`);
  if (!response.ok) return null;
  return response.json();
}

export async function updateInstructions(
  employeeId: string,
  instructionsMd: string,
): Promise<{ instructionsMd: string }> {
  const response = await fetch(`/api/employees/${employeeId}/instructions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructionsMd }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Failed to save.");
  return data;
}

export async function fetchKnowledgeGapQuestion(
  employeeId: string,
  transcript: OnboardingTranscriptEntry[],
): Promise<NextQuestionResult> {
  const response = await fetch(`/api/employees/${employeeId}/knowledge-gaps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  if (!response.ok) throw new Error("Failed to check for gaps.");
  return response.json();
}

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

export async function applyKnowledgeRefresh(
  employeeId: string,
  transcript: OnboardingTranscriptEntry[],
): Promise<KnowledgeRefreshResult | null> {
  const response = await fetch(`/api/employees/${employeeId}/apply-knowledge-refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  const data = await response.json();
  return response.ok ? (data as KnowledgeRefreshResult) : null;
}
