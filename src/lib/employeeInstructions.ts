import { z } from "zod";
import { getModel } from "@/lib/agents/model";
import { generateObject } from "@/lib/agents/tracing";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import {
  buildTranscriptContext,
  type OnboardingTranscriptEntry,
} from "@/lib/onboardingQuestions";

const instructionsSchema = z.object({
  instructionsMd: z.string(),
});

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
  const transcriptContext = await buildTranscriptContext(transcript);
  const prompt = `You just finished onboarding a new founder as ${agentName}. Turn what they told you into a short markdown note capturing only the founder's own preferences for how you specifically should work — not general business facts (those go in the Business Profile, written separately).

Conversation:
${transcriptContext}

Write "instructionsMd": a short, concrete markdown note (a few bullet points, "## Heading"s only if genuinely needed) covering things like sign-off style, exclusions, things never to claim or promise, pacing/volume preferences, or anything else the founder specifically asked for. If nothing beyond small talk or a generic "nothing to add" came up, return an empty string — don't invent content.`;

  const { object } = await generateObject({
    model: getModel(),
    schema: instructionsSchema,
    prompt,
  });

  return object;
}

/**
 * Folds a gap-followup conversation into the founder's existing Instructions
 * note for one employee — keeps still-valid points, updates ones the new
 * answers supersede, adds anything new. Used by the Instructions tab's
 * "Check for gaps" action, as distinct from fresh-onboarding synthesis above.
 */
export async function mergeEmployeeInstructions(input: {
  role: EmployeeRole;
  existingInstructionsMd: string;
  transcript: OnboardingTranscriptEntry[];
}): Promise<{ instructionsMd: string }> {
  const { role, existingInstructionsMd, transcript } = input;

  const agentName = ROLE_LABELS[role];
  const transcriptContext = await buildTranscriptContext(transcript);
  const prompt = `You are ${agentName}. Here's your current Instructions note — the founder's own preferences for how you specifically should work, as distinct from the shared Business Profile:

${existingInstructionsMd || "(nothing on file yet)"}

The founder just answered a few follow-up questions closing gaps in that note:
${transcriptContext}

Write the full, updated "instructionsMd": fold the new answers in — keep bullets that are still valid, update or replace any the new answers supersede, add new ones for anything not covered before. Keep it a short, concrete markdown note (a few bullet points, "## Heading"s only if genuinely needed), not a rewrite from scratch.`;

  const { object } = await generateObject({
    model: getModel(),
    schema: instructionsSchema,
    prompt,
  });

  return object;
}
