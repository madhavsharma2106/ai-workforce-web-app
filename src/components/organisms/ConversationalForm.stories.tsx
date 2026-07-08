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
    agentName: "Alex",
    confirmLabel: "Continue →",
    questions: [
      {
        key: "businessName",
        prompt:
          "Hi, I'm Alex — I'll make sure everyone you hire understands your business. First: what's your business called?",
        placeholder: "Your business name",
      },
      {
        key: "businessDescription",
        prompt: "And what does your business do?",
        placeholder: "e.g. We build custom video ads for B2B SaaS companies...",
      },
      {
        key: "idealClient",
        prompt: "What does your ideal client look like?",
        placeholder: "e.g. Series A-C SaaS companies with a sales team...",
      },
      {
        key: "badLeadCriteria",
        prompt: "And what should we steer clear of — what's a bad-fit lead?",
        placeholder: "e.g. Agencies, consumer brands, companies too small...",
      },
      {
        key: "valueProp",
        prompt: "Why do clients pick you over the alternative?",
        placeholder: "e.g. Faster turnaround, better creative, lower cost...",
      },
      {
        key: "tone",
        prompt: "What tone should we use when reaching out on your behalf?",
        placeholder: "Formal, casual, direct...",
        chips: ["Formal", "Casual & friendly", "Direct, no-fluff"],
      },
      {
        key: "priorities",
        prompt: "Anything specific you're focused on right now?",
        placeholder: "Optional — a segment, campaign, or push this quarter",
        optional: true,
      },
      {
        key: "dosDonts",
        prompt: "Anything we should never say or do in outreach?",
        placeholder: "Optional — e.g. never mention pricing, avoid competitor X",
        optional: true,
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
