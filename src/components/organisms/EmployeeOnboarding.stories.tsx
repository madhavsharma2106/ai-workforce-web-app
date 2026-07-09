import { useEffect, type ReactNode } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { withAppRouterMock } from "../../../.storybook/decorators";
import EmployeeOnboarding from "./EmployeeOnboarding";

const mockFetch: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.toString();

  if (url.includes("/onboarding-questions")) {
    const body = init?.body ? JSON.parse(init.body as string) : { transcript: [] };
    const answered = body.transcript?.length ?? 0;
    const payload =
      answered === 0
        ? {
            done: false,
            question: {
              prompt: "Hi — what should I know before I get started?",
              placeholder: "Optional — anything you'd like me to know",
              optional: true,
            },
          }
        : { done: true };
    return new Response(JSON.stringify(payload), { status: 200 });
  }

  if (url.includes("/complete-onboarding")) {
    return new Response(JSON.stringify({ redirectTo: "/dashboard" }), {
      status: 200,
    });
  }

  return new Response(JSON.stringify({ error: "Unhandled in story" }), {
    status: 404,
  });
};

/**
 * EmployeeOnboarding now fetches its questions from a live API route (LLM-
 * backed), which doesn't exist in Storybook — stub fetch with one canned
 * question and an immediate completion so the story renders without a
 * backend. Not a demonstration of the real adaptive behavior.
 */
const FetchMock = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = mockFetch;
    return () => {
      window.fetch = original;
    };
  }, []);
  return <>{children}</>;
};

const withOnboardingFetchMock: Decorator = (Story) => (
  <FetchMock>
    <Story />
  </FetchMock>
);

const meta = {
  title: "Organisms/EmployeeOnboarding",
  component: EmployeeOnboarding,
  parameters: { layout: "centered" },
  decorators: [
    withAppRouterMock,
    withOnboardingFetchMock,
    (Story) => (
      <div style={{ width: 420, height: 520 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    employeeId: "story-employee-id",
  },
} satisfies Meta<typeof EmployeeOnboarding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LeadSourcer: Story = {
  args: { role: "lead_sourcer" },
};

export const AccountManager: Story = {
  args: { role: "account_manager" },
};

export const SalesRepresentative: Story = {
  args: { role: "sales_representative" },
};
