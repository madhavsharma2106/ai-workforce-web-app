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
