import { searchPeople } from "@/lib/integrations/apollo";
import type { ApprovalStatus, Day, Lead } from "@/lib/types";

export async function searchLeadsForClient(
  clientDescription: string,
  badLeadCriteria = "",
) {
  const people = await searchPeople({
    icp: clientDescription,
    excludeCriteria: badLeadCriteria,
  });

  const leads: Lead[] = people
    .filter((person) => person.organization)
    .map((person, index) => ({
      id: index + 1,
      company: person.organization!.name,
      website:
        person.organization!.primary_domain ??
        person.organization!.website_url ??
        "",
      fit: `Matches ICP: ${clientDescription}`,
      decisionMaker: person.title
        ? `${person.name}, ${person.title}`
        : person.name,
      email: "",
      draft: `Hi ${person.name.split(" ")[0]}, I came across ${person.organization!.name} and thought there could be a good fit here. Would love to share more.`,
      sources: "Apollo.io",
      personId: person.id,
      emailRevealed: false,
    }));

  return { leads, researched: people.length };
}

function formatDateLabel(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function buildFirstDay(
  leads: Lead[],
  researched: number,
  contactName: string,
): Day {
  return {
    id: 1,
    dateLabel: formatDateLabel(0),
    leads,
    statuses: leads.reduce(
      (acc, lead) => ({ ...acc, [lead.id]: "pending" as ApprovalStatus }),
      {} as Record<number, ApprovalStatus>,
    ),
    drafts: leads.reduce(
      (acc, lead) => ({ ...acc, [lead.id]: lead.draft }),
      {} as Record<number, string>,
    ),
    feedback: {},
    standup: `Good morning${contactName ? `, ${contactName}` : ""}. I found ${leads.length} qualified leads today and prepared personalized emails for review.`,
    learned:
      "This is my first day on the job — every approval or rejection you give me will sharpen tomorrow's picks.",
    researched,
  };
}
