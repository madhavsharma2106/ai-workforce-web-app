import type { FC } from "react";
import { Card, Eyebrow, Text } from "@/components/atoms";

type PassedCandidate = { company: string; reason: string };

type Props = {
  candidates: PassedCandidate[];
};

const PassedCandidatesList: FC<Props> = ({ candidates }) => {
  if (candidates.length === 0) return null;

  return (
    <Card as="section" padding="lg" className="space-y-3">
      <Eyebrow>Also reviewed, passed on</Eyebrow>
      <div className="divide-y divide-gray-100">
        {candidates.map((candidate) => (
          <div key={candidate.company} className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm">
            <Text size="sm" weight="medium" className="text-gray-700">
              {candidate.company}
            </Text>
            <Text size="sm" tone="muted">
              — {candidate.reason}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PassedCandidatesList;
