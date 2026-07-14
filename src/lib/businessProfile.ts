import { z } from "zod";
import { getModel } from "@/lib/agents/model";
import { generateObject } from "@/lib/agents/tracing";
import type { OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";

const profileSchema = z.object({
  businessName: z.string(),
  contactName: z.string(),
  profileMd: z.string(),
});

const formatTranscript = (transcript: OnboardingTranscriptEntry[]): string =>
  transcript
    .map(
      (entry, index) =>
        `${index + 1}. Q: ${entry.prompt}\n   A: ${entry.answer || "(skipped)"}`,
    )
    .join("\n");

/**
 * Synthesizes an onboarding conversation into a Business Profile other
 * employees read as context. The write-up is organized however best fits
 * what the founder actually said — not a fixed template.
 */
export async function synthesizeBusinessProfile(input: {
  transcript: OnboardingTranscriptEntry[];
}): Promise<{ businessName: string; contactName: string; profileMd: string }> {
  const { transcript } = input;

  const prompt = `You just finished an onboarding conversation with a new founder as Alex, their Account Manager. Turn it into a Business Profile other AI employees (a lead sourcer, a sales rep) will read as context before doing their jobs — it needs to be precise enough that they don't have to re-ask the founder anything basic.

Conversation:
${formatTranscript(transcript)}

Write:
- "businessName": the business's name, or "" if it wasn't mentioned.
- "contactName": the founder's own name, or "" if it wasn't mentioned.
- "profileMd": a well-organized markdown document covering everything relevant from the conversation (e.g. business description, ideal client, bad-fit criteria, value proposition, tone, priorities, do's/don'ts — plus anything else that came up), organized with "## Heading" sections however best fits what was actually said. Be concrete and specific, not generic.`;

  const { object } = await generateObject({
    model: getModel(),
    schema: profileSchema,
    prompt,
  });

  return object;
}

/**
 * Folds a gap-followup conversation into the existing Business Profile —
 * keeps still-valid content, updates or replaces anything the new answers
 * supersede, adds anything new. Used by Alex's "Check for gaps" action, as
 * distinct from fresh-onboarding synthesis above.
 */
export async function mergeBusinessProfile(input: {
  existingProfile: { businessName: string; contactName: string; profileMd: string };
  transcript: OnboardingTranscriptEntry[];
}): Promise<{ businessName: string; contactName: string; profileMd: string }> {
  const { existingProfile, transcript } = input;

  const prompt = `You are Alex, the founder's Account Manager. Here's the current Business Profile other AI employees read as context:

- Business name: ${existingProfile.businessName || "(not provided)"}
- Founder's name: ${existingProfile.contactName || "(not provided)"}
- Description:
${existingProfile.profileMd || "(nothing on file yet)"}

The founder just answered a few follow-up questions closing gaps in that profile:
${formatTranscript(transcript)}

Write the full, updated profile:
- "businessName" / "contactName": updated only if the conversation gave new or corrected values, otherwise keep the existing ones as-is.
- "profileMd": fold the new answers into the existing document — keep sections that are still valid, update or replace any the new answers supersede, add new "## Heading" sections for anything not covered before. Keep it precise and concrete, not a rewrite from scratch.`;

  const { object } = await generateObject({
    model: getModel(),
    schema: profileSchema,
    prompt,
  });

  return object;
}
