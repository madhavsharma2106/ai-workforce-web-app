import { Card, EmployeeAvatar, Eyebrow, Heading, Text } from "@/components/atoms";

type Props = {
  employeeId: string;
};

const SalesRepresentativeHome = ({ employeeId }: Props) => (
  <main>
    <Card as="section" padding="lg">
      <div className="flex items-center gap-4">
        <EmployeeAvatar seed={employeeId} size="lg" />
        <div>
          <Eyebrow>Active employee</Eyebrow>
          <Heading as="h2" size="md" className="mt-1">
            Hi, I&apos;m Oliver
          </Heading>
          <Text size="sm" tone="muted" className="mt-2 max-w-xl">
            I turn Emma&apos;s approved outreach into real conversations —
            sending and follow-ups aren&apos;t wired up yet in this preview
            build.
          </Text>
        </div>
      </div>
    </Card>
  </main>
);

export default SalesRepresentativeHome;
