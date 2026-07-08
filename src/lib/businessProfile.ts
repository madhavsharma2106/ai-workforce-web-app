export type BusinessProfileSection = {
  key: string;
  header: string;
  optional?: boolean;
};

export const BUSINESS_PROFILE_SECTIONS: BusinessProfileSection[] = [
  { key: "businessDescription", header: "Business" },
  { key: "idealClient", header: "Ideal client" },
  { key: "badLeadCriteria", header: "Bad-fit criteria" },
  { key: "valueProp", header: "Value proposition" },
  { key: "tone", header: "Tone" },
  { key: "priorities", header: "Current priorities", optional: true },
  { key: "dosDonts", header: "Do's and don'ts", optional: true },
];

/** Builds the `business_profiles.profile_md` markdown from onboarding/edit answers. */
export function buildProfileMarkdown(answers: Record<string, string>): string {
  const blocks: string[] = [];

  for (const section of BUSINESS_PROFILE_SECTIONS) {
    const value = (answers[section.key] || "").trim();
    if (section.optional && !value) continue;
    blocks.push(`## ${section.header}\n${value || "(not provided)"}`);
  }

  return blocks.join("\n\n");
}

/** Reverses `buildProfileMarkdown` — used to prefill the edit form and render the read view. */
export function parseProfileMarkdown(profileMd: string): Record<string, string> {
  const headerToKey = new Map(
    BUSINESS_PROFILE_SECTIONS.map((section) => [section.header, section.key]),
  );
  const answers: Record<string, string> = {};

  const parts = `\n${profileMd}`.split("\n## ").filter(Boolean);
  for (const part of parts) {
    const newlineIndex = part.indexOf("\n");
    const header = (newlineIndex === -1 ? part : part.slice(0, newlineIndex)).trim();
    const body = newlineIndex === -1 ? "" : part.slice(newlineIndex + 1).trim();

    const key = headerToKey.get(header);
    if (!key) continue;

    answers[key] = body === "(not provided)" ? "" : body;
  }

  return answers;
}
