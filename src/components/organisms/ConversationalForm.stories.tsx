import type { Meta, StoryObj } from "@storybook/react-vite";
import ConversationalForm from "./ConversationalForm";

const meta = {
  title: "Organisms/ConversationalForm",
  component: ConversationalForm,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 420, height: 520 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onComplete: (answers) => console.log("onComplete", answers),
  },
} satisfies Meta<typeof ConversationalForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmmaOnboarding: Story = {
  args: {
    agentName: "Emma",
    confirmLabel: "Confirm hire →",
    questions: [
      {
        key: "clientDescription",
        prompt:
          "Hi, I'm Emma — I'll be sourcing leads and drafting outreach for you. First: what does your ideal client look like?",
        placeholder: "e.g. B2B SaaS companies with weak video presence...",
        chips: [
          "B2B SaaS companies with weak online presence",
          "Local service businesses ready to grow",
          "E-commerce brands scaling past $1M",
        ],
      },
      {
        key: "badLeadCriteria",
        prompt:
          "Good to know. And what should I steer clear of — what does a bad-fit lead look like?",
        placeholder: "e.g. Agencies, consumer brands, companies too small...",
        chips: [
          "Agencies and consultants",
          "Companies too small to afford us",
          "Already working with a competitor",
        ],
      },
      {
        key: "name",
        prompt: "Last thing — what should I call you?",
        placeholder: "Your name (optional)",
        optional: true,
      },
    ],
  },
};

export const AccountManagerOnboarding: Story = {
  args: {
    agentName: "Account Manager",
    confirmLabel: "Continue →",
    questions: [
      {
        key: "businessDescription",
        prompt:
          "Hi, I'm your Account Manager — I'll make sure everyone you hire understands your business. What does your business do?",
        placeholder: "e.g. We build custom video ads for B2B SaaS companies...",
      },
      {
        key: "idealClient",
        prompt: "Who's your ideal client?",
        placeholder: "e.g. Series A-C SaaS companies with a sales team...",
      },
    ],
  },
};

export const SingleQuestion: Story = {
  args: {
    agentName: "Emma",
    confirmLabel: "Done",
    questions: [
      {
        key: "name",
        prompt: "What should I call you?",
        placeholder: "Your name (optional)",
        optional: true,
      },
    ],
  },
};
