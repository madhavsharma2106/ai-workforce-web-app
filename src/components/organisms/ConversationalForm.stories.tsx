import type { Meta, StoryObj } from "@storybook/react-vite";
import ConversationalForm, {
  type ConversationalFormQuestion,
  type NextQuestionResult,
  type TranscriptEntry,
} from "./ConversationalForm";

/** Walks a fixed list of questions — stand-in for the real LLM-backed fetcher, for stories only. */
const scriptedQuestions = (
  questions: ConversationalFormQuestion[],
): ((transcript: TranscriptEntry[]) => Promise<NextQuestionResult>) => {
  return async (transcript) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const next = questions[transcript.length];
    return next ? { done: false, question: next } : { done: true };
  };
};

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
    onComplete: (transcript: TranscriptEntry[]) =>
      console.log("onComplete", transcript),
  },
} satisfies Meta<typeof ConversationalForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmmaOnboarding: Story = {
  args: {
    agentName: "Emma",
    confirmLabel: "Confirm hire →",
    fetchNextQuestion: scriptedQuestions([
      {
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
        prompt: "Last thing — what should I call you?",
        placeholder: "Your name (optional)",
        optional: true,
      },
    ]),
  },
};

export const AccountManagerOnboarding: Story = {
  args: {
    agentName: "Alex",
    confirmLabel: "Continue →",
    fetchNextQuestion: scriptedQuestions([
      {
        prompt:
          "Hi, I'm Alex — I'll make sure everyone you hire understands your business. First: what's your business called?",
        placeholder: "Your business name",
      },
      {
        prompt: "And what does your business do?",
        placeholder: "e.g. We build custom video ads for B2B SaaS companies...",
      },
      {
        prompt: "What does your ideal client look like?",
        placeholder: "e.g. Series A-C SaaS companies with a sales team...",
      },
      {
        prompt: "And what should we steer clear of — what's a bad-fit lead?",
        placeholder: "e.g. Agencies, consumer brands, companies too small...",
      },
      {
        prompt: "Why do clients pick you over the alternative?",
        placeholder: "e.g. Faster turnaround, better creative, lower cost...",
      },
      {
        prompt: "What tone should we use when reaching out on your behalf?",
        placeholder: "Formal, casual, direct...",
        chips: ["Formal", "Casual & friendly", "Direct, no-fluff"],
      },
      {
        prompt: "Last thing — what should I call you?",
        placeholder: "Your name (optional)",
        optional: true,
      },
    ]),
  },
};

export const SingleQuestion: Story = {
  args: {
    agentName: "Emma",
    confirmLabel: "Done",
    fetchNextQuestion: scriptedQuestions([
      {
        prompt: "What should I call you?",
        placeholder: "Your name (optional)",
        optional: true,
      },
    ]),
  },
};
