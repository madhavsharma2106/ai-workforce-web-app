import { Button, Card, Eyebrow, Heading, Text } from "@/components/atoms";

type Props = {
  onSearchAgain: () => void;
};

const RunNotStartedCard = ({ onSearchAgain }: Props) => (
  <Card as="section" padding="lg">
    <Eyebrow>Emma</Eyebrow>
    <Heading as="h2" size="md" className="mt-1">
      No search yet
    </Heading>
    <Text size="sm" tone="muted" className="mt-2">
      I haven&apos;t started looking for leads yet. Kick off a search whenever you&apos;re ready.
    </Text>
    <Button variant="primary" className="mt-4" onClick={onSearchAgain}>
      Start search
    </Button>
  </Card>
);

export default RunNotStartedCard;
