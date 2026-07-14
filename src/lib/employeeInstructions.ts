import { z } from "zod";
import { getModel } from "@/lib/agents/model";
import { generateObject } from "@/lib/agents/tracing";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import type { OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";

const instructionsSchema = z.object({
  instructionsMd: z.string(),
});

const formatTranscript = (transcript: OnboardingTranscriptEntry[]): string =>
  transcript
    .map(
      (entry, index) =>
        `${index + 1}. Q: ${entry.prompt}\n   A: ${entry.answer || "(skipped)"}`,
    )
    .join("\n");

/**
 * Synthesizes an onboarding conversation into a short Instructions note for
 * one employee — the founder's own stated preferences for them specifically
 * (sign-off style, exclusions, things never to claim), as distinct from the
 * shared Business Profile. Empty if nothing beyond the opener came up.
 */
export async function synthesizeEmployeeInstructions(input: {
  role: EmployeeRole;
  transcript: OnboardingTranscriptEntry[];
}): Promise<{ instructionsMd: string }> {
  const { role, transcript } = input;

  if (transcript.length === 0) {
    return { instructionsMd: "" };
  }

  const agentName = ROLE_LABELS[role];
  const prompt = `You just finished onboarding a new founder as ${agentName}. Turn what they told you into a short markdown note capturing only the founder's own preferences for how you specifically should work — not general business facts (those go in the Business Profile, written separately).

Conversation:
${formatTranscript(transcript)}

Write "instructionsMd": a short, concrete markdown note (a few bullet points, "## Heading"s only if genuinely needed) covering things like sign-off style, exclusions, things never to claim or promise, pacing/volume preferences, or anything else the founder specifically asked for. If nothing beyond small talk or a generic "nothing to add" came up, return an empty string — don't invent content.`;

  const { object } = await generateObject({
    model: getModel(),
    schema: instructionsSchema,
    prompt,
  });

  return object;
}
