import type { AgentRun } from "@/lib/types";
import { Button, Card, Eyebrow, Heading, Text } from "@/components/atoms";

const STUCK_THRESHOLD_MS = 90_000;

type Props = {
  run: AgentRun | null;
  now: number | null;
  onSearchAgain: () => void;
};

const RunInProgressCard = ({ run, now, onSearchAgain }: Props) => {
  const stuck =
    run !== null && now !== null && now - new Date(run.created_at).getTime() > STUCK_THRESHOLD_MS;

  return (
    <Card as="section" padding="lg">
      <Eyebrow>Emma</Eyebrow>
      <Heading as="h2" size="md" className="mt-1">
        I'm researching leads…
      </Heading>
      <Text size="sm" tone="muted" className="mt-2">
        I'm searching for companies that match your profile and drafting
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
  );
};

export default RunInProgressCard;
