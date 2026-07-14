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
  | { done: true; message?: string }
  | { done: false; question: OnboardingQuestion };

/** Hard cap regardless of model output — no onboarding conversation should run away. */
const MAX_QUESTIONS = 10;
/** Smaller cap for gap follow-ups — a delta check against existing knowledge, not fresh onboarding. */
const GAP_MAX_QUESTIONS = 5;

const questionSchema = z.object({
  done: z.boolean(),
  message: z.string().optional(),
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

Decide the single next question to ask (or that you're done). Ask one thing at a time, in character as ${agentName}, adapting to what's already been said — don't just work down a checklist. Only ask about things that are genuinely the founder's preference or knowledge to provide — never ask how the product's own mechanics work (how work reaches you, how handoffs between employees happen, what's automatic vs. manual); those are fixed, not something to gather from the founder, so if the role guidance above doesn't name it as a preference to ask about, assume it's handled and don't raise it. Offer 2-4 short "chips" (quick-pick answers) only when the question has a small set of natural options. Set "optional" for questions the founder can reasonably skip.

Judge everything against one guiding question: do you know enough yet to do genuinely good, specific work for this founder, or would you still be guessing or generic on something that matters? The "By the end you should know, at minimum" list above is a floor to cover, not the finish line — work through it explicitly (each item answered, or explicitly confirmed the founder has nothing to add), but checking every item doesn't mean you're done if an answer is still too thin to act on well. If the founder's last answer was too vague to act on ("not sure", "whatever you think") for something that would visibly affect the quality of your work, ask one sharper follow-up on that same point before moving on — a founder who doesn't know what you need is exactly why this is your job to notice, not theirs to volunteer. Only set "done": true once the answers so far would actually let you do specific, non-generic work, not just once the list is nominally covered.`;

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

/**
 * Compares what's already on file for this employee against the role's
 * onboarding checklist and asks about concrete gaps only — a delta check
 * triggered from the Instructions tab, not fresh onboarding.
 */
export async function generateGapFollowup(input: {
  role: EmployeeRole;
  currentKnowledgeMd: string;
  transcript: OnboardingTranscriptEntry[];
  knownProfile?: string | null;
}): Promise<NextQuestionResult> {
  const { role, currentKnowledgeMd, transcript, knownProfile } = input;

  if (transcript.length >= GAP_MAX_QUESTIONS) {
    return { done: true, message: "That's plenty for now — thanks for the updates." };
  }

  const agentName = ROLE_LABELS[role];
  const roleMarkdown = loadRoleMarkdown(role);
  const knownProfileText = knownProfile
    ? `\n\nExisting Business Profile on file for this founder (don't re-ask what's already covered here):\n${knownProfile}`
    : "";

  const prompt = `You are ${agentName}. The founder already onboarded you once. Here's what's on file for you specifically today:

${currentKnowledgeMd || "(nothing on file yet)"}${knownProfileText}

Follow the "## Onboarding" section below for the minimum-knowledge checklist and what "good" looks like for this role.

${roleMarkdown}

Questions you've already asked this session:
${formatTranscript(transcript)}

Your job right now is not to re-run onboarding — it's to judge, against one guiding question, whether what's on file would let you do genuinely good, specific work for this founder today, or whether something would come out generic or templated because of a gap. Check the "at minimum" checklist as a floor: a checklist item only counts as covered if the existing note answers it specifically and concretely — an item that's technically present but vague or generic is still a gap worth asking about. Don't re-ask anything the existing note already answers well.

This is a returning conversation, not a first meeting — the founder already knows ${agentName} and has already been through onboarding. Skip any introduction, greeting, or mission recap (no "Hi, I'm ${agentName}..."); go straight into the specific follow-up question, framed as a quick check-in (e.g. "Quick one — ...") rather than an opener. If you find a real gap, ask about the single most important one. If nothing meaningful is missing, set "done": true right away — including immediately, on the very first question, if the existing note already holds up well against the checklist. Always set a short, friendly "message" when "done": true, explaining briefly why you're stopping (e.g. "Everything I need is already here" or "Got what I needed, thanks").`;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: questionSchema,
      prompt,
    });

    if (object.done || !object.question) {
      return {
        done: true,
        message: object.message || "Everything looks covered — nothing more to ask.",
      };
    }

    return { done: false, question: object.question };
  } catch {
    return { done: true, message: "Couldn't check for gaps right now — try again later." };
  }
}
