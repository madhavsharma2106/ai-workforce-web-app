import type { AgentRun, AgentRunStep } from "@/lib/types";
import { Button, Card, Eyebrow, Heading, Text } from "@/components/atoms";
import { ActivityCard } from "./ActivityCard";

const STUCK_THRESHOLD_MS = 90_000;

type Props = {
  run: AgentRun;
  steps: AgentRunStep[];
  now: number | null;
  onSearchAgain: () => void;
};

export const RunInProgressCard = ({
  run,
  steps,
  now,
  onSearchAgain,
}: Props) => {
  const stuck =
    now !== null &&
    now - new Date(run.created_at).getTime() > STUCK_THRESHOLD_MS;

  return (
    <>
      <Card as="section" padding="lg">
        <Eyebrow>Emma</Eyebrow>
        <Heading as="h2" size="xl" italic className="mt-1">
          I&apos;m researching leads…
        </Heading>
        <Text size="sm" tone="subtle" className="mt-2">
          I&apos;m searching for companies that match your profile and drafting
          outreach — this can take a minute.
        </Text>
        {stuck && (
          <div className="mt-4 space-y-2">
            <Text size="sm" tone="muted">
              This is taking longer than expected.
            </Text>
            <Button variant="secondary" onClick={onSearchAgain}>
              Search again
            </Button>
          </div>
        )}
      </Card>
      <ActivityCard
        steps={steps}
        eyebrow="Live activity"
        title="What I'm doing"
        defaultExpanded
      />
    </>
  );
};
