import { useEffect, useState } from "react";
import { getLatestRun } from "@/lib/api/employees";
import type {
  AgentRun,
  AgentRunStep,
  Lead,
  PassedCandidate,
} from "@/lib/types";

const POLL_INTERVAL_MS = 3000;

type LatestRunState = {
  run: AgentRun | null;
  leads: Lead[];
  researchedCount: number;
  steps: AgentRunStep[];
  passedCandidates: PassedCandidate[];
};

const isInProgress = (run: AgentRun | null) =>
  run === null || run.status === "queued" || run.status === "running";

export function useLatestRun(employeeId: string, initial: LatestRunState) {
  const [run, setRun] = useState<AgentRun | null>(initial.run);
  const [leads, setLeads] = useState<Lead[]>(initial.leads);
  const [researchedCount, setResearchedCount] = useState(
    initial.researchedCount,
  );
  const [steps, setSteps] = useState<AgentRunStep[]>(initial.steps);
  const [passedCandidates, setPassedCandidates] = useState<PassedCandidate[]>(
    initial.passedCandidates,
  );
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!isInProgress(run)) return;

    const interval = setInterval(async () => {
      setNow(Date.now());
      try {
        const data = await getLatestRun(employeeId);
        if (!data) return;
        setRun(data.run);
        setLeads(data.leads);
        setResearchedCount(data.researchedCount);
        setPassedCandidates(data.passedCandidates);
        setSteps(data.steps);
      } catch (error) {
        console.error("Failed to poll latest run", error);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [employeeId, run]);

  return {
    run,
    setRun,
    leads,
    setLeads,
    researchedCount,
    steps,
    passedCandidates,
    now,
  };
}
