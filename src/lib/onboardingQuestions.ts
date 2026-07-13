import { z } from "zod";
import { getModel } from "@/lib/agents/model";
import { generateObject } from "@/lib/agents/tracing";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import { loadRoleMarkdown } from "@/lib/roles";

export type OnboardingTranscriptEntry = { prompt: string; answer: string };

export type OnboardingQuestion = {
  prompt: string;
  placeholder: string;
  optional?: boolean;
  chips?: string[];
};

export type NextQuestionResult =
  | { done: true }
  | { done: false; question: OnboardingQuestion };

/** Hard cap regardless of model output — no onboarding conversation should run away. */
const MAX_QUESTIONS = 10;

const questionSchema = z.object({
  done: z.boolean(),
  question: z
    .object({
      prompt: z.string(),
      placeholder: z.string(),
      optional: z.boolean().optional(),
      chips: z.array(z.string()).max(4).optional(),
    })
    .optional(),
});

/** Last-resort opener if the model call fails on the very first question. */
const FALLBACK_QUESTIONS: Record<EmployeeRole, OnboardingQuestion> = {
  account_manager: {
    prompt:
      "Hi, I'm Alex — I'll make sure everyone you hire understands your business. First: what's your business called?",
    placeholder: "Your business name",
  },
  lead_sourcer: {
    prompt:
      "Hi, I'm Emma — I'll be sourcing leads and drafting outreach for you. Anything I should know before I start?",
    placeholder: "Optional — anything you'd like me to know",
    optional: true,
  },
  sales_representative: {
    prompt:
      "Hi, I'm Oliver — I'll turn Emma's approved outreach into real conversations once that part of the product is built. Anything I should know before I start?",
    placeholder: "Optional — anything you'd like me to know",
    optional: true,
  },
};

const formatTranscript = (transcript: OnboardingTranscriptEntry[]): string =>
  transcript.length
    ? transcript
        .map(
          (entry, index) =>
            `${index + 1}. Q: ${entry.prompt}\n   A: ${entry.answer || "(skipped)"}`,
        )
        .join("\n")
    : "(nothing asked yet — this is the opening question)";

/**
 * Generates the next onboarding question, adapted to the conversation so
 * far. What to cover and when to stop comes from the role's "## Onboarding"
 * section in `roles/<role>.md` — this function only supplies the mechanics
 * (persona, one-question-at-a-time, JSON shape).
 */
export async function generateNextQuestion(input: {
  role: EmployeeRole;
  transcript: OnboardingTranscriptEntry[];
  knownProfile?: string | null;
}): Promise<NextQuestionResult> {
  const { role, transcript, knownProfile } = input;

  if (transcript.length >= MAX_QUESTIONS) {
    return { done: true };
  }

  const agentName = ROLE_LABELS[role];
  const roleMarkdown = loadRoleMarkdown(role);
  const knownProfileText = knownProfile
    ? `\n\nExisting Business Profile on file for this founder (don't re-ask what's already covered here):\n${knownProfile}`
    : "";

  const prompt = `You are ${agentName}, onboarding a new founder. Follow the "## Onboarding" section below for what to cover and how to speak.

${roleMarkdown}${knownProfileText}

Conversation so far:
${formatTranscript(transcript)}

Decide the single next question to ask (or that you're done). Ask one thing at a time, in character as ${agentName}, adapting to what's already been said — don't just work down a checklist. Only ask about things that are genuinely the founder's preference or knowledge to provide — never ask how the product's own mechanics work (how work reaches you, how handoffs between employees happen, what's automatic vs. manual); those are fixed, not something to gather from the founder, so if the role guidance above doesn't name it as a preference to ask about, assume it's handled and don't raise it. Offer 2-4 short "chips" (quick-pick answers) only when the question has a small set of natural options. Set "optional" for questions the founder can reasonably skip. Set "done": true once you have enough to do the job well per the Onboarding guidance.`;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: questionSchema,
      prompt,
    });

    if (object.done || !object.question) {
      return { done: true };
    }

    return { done: false, question: object.question };
  } catch {
    if (transcript.length === 0) {
      return { done: false, question: FALLBACK_QUESTIONS[role] };
    }
    // Mid-conversation failure: wrap up gracefully with what we already have
    // rather than leaving the founder stuck.
    return { done: true };
  }
}
