import Link from "next/link";
import { Eyebrow, Heading, Text } from "@/components/atoms";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <main className="space-y-20">
          <section className="border-b border-gray-200 pb-16 pt-8">
            <div className="mx-auto max-w-2xl space-y-6 text-center">
              <Eyebrow>New era of work</Eyebrow>
              <Heading as="h1" size="xl">
                Hire AI employees that work every morning.
              </Heading>
              <Text size="lg" tone="muted" className="mx-auto max-w-lg">
                Your first employee sources leads, drafts outreach, and waits
                for your approval.
              </Text>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                  Hire your first employee
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
