import type { AgentRun } from "@/lib/types";
import { Button, Card, Eyebrow, Heading, Text } from "@/components/atoms";
import { Alert } from "@/components/molecules";

type Props = {
  run: AgentRun;
  onSearchAgain: () => void;
};

export const RunFailedCard = ({ run, onSearchAgain }: Props) => (
  <Card as="section" padding="lg">
    <Eyebrow>Emma</Eyebrow>
    <Heading as="h2" size="md" className="mt-1">
      Something went wrong on this search
    </Heading>
    <Text size="sm" tone="muted" className="mt-2">
      I wasn&apos;t able to finish this task. Here&apos;s what happened:
    </Text>
    <Alert variant="error" className="mt-4">
      {run.summary ??
        "I ran into an unexpected problem and couldn't finish this task."}
    </Alert>
    <Button variant="secondary" className="mt-4" onClick={onSearchAgain}>
      Try again
    </Button>
  </Card>
);
