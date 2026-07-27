import type { FC } from "react";
import { Badge, Card, Eyebrow, Text } from "@/components/atoms";
import type { LearningsSummary } from "@/lib/leads";

type Props = {
  learnings: LearningsSummary;
};

export const LearningsSummaryPanel: FC<Props> = ({ learnings }) => {
  const { approvedCount, rejectedCount, topRejectionReasons, segmentStats } =
    learnings;
  if (approvedCount === 0 && rejectedCount === 0) return null;

  return (
    <Card as="section" padding="lg" className="space-y-3">
      <Eyebrow>What I&apos;ve learned</Eyebrow>
      <Text size="sm" tone="subtle">
        {approvedCount} approved, {rejectedCount} passed on so far.
      </Text>
      {topRejectionReasons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Text size="xs" tone="muted">
            Most common reasons passed on:
          </Text>
          {topRejectionReasons.map(({ reason, count }) => (
            <Badge key={reason} tone="neutral" size="sm">
              {reason} ({count})
            </Badge>
          ))}
        </div>
      )}
      {segmentStats.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Text size="xs" tone="muted">
            By segment:
          </Text>
          {segmentStats.map((stat) => (
            <Badge key={stat.segment} tone="neutral" size="sm">
              {stat.segment}: {stat.approved}/
              {stat.approved + stat.rejected + stat.pending} approved
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};
