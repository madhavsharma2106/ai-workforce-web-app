import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Day } from "@/lib/types";
import LeadSourcerHome from "./LeadSourcerHome";

const employeeId = "story-lead-sourcer";

const mockDay: Day = {
  id: 4,
  dateLabel: "Thursday, July 9",
  researched: 32,
  standup: "Focused on Series B-C SaaS teams that just posted SDR openings — a good signal they're ramping outbound and could use help with creative.",
  learned: "Companies that mention \"in-house creative\" in job posts are worse fits — they've already solved this problem.",
  leads: [
    {
      id: 1,
      company: "Northwind Robotics",
      website: "northwindrobotics.com",
      fit: "Series B SaaS company with a growing outbound sales team and no in-house video capability.",
      decisionMaker: "Priya Shah, VP Marketing",
      email: "priya@northwindrobotics.com",
      draft: "Hi Priya,\n\nI noticed Northwind Robotics has been scaling its outbound team...",
      sources: "LinkedIn, company blog, Crunchbase",
    },
    {
      id: 2,
      company: "Fieldstack",
      website: "fieldstack.io",
      fit: "Recently raised a Series A, hiring 3 SDRs, no video presence on their site.",
      decisionMaker: "Marcus Lee, Head of Growth",
      email: "",
      draft: "Hi Marcus,\n\nCongrats on the raise — saw Fieldstack is scaling the sales team...",
      sources: "LinkedIn, Crunchbase",
      personId: "person_fieldstack",
      emailRevealed: false,
    },
    {
      id: 3,
      company: "Vantage Metrics",
      website: "vantagemetrics.com",
      fit: "Mature analytics platform, strong existing outbound motion.",
      decisionMaker: "Dana Ruiz, VP Sales",
      email: "dana@vantagemetrics.com",
      draft: "Hi Dana,\n\nVantage Metrics' outbound content is already strong, but...",
      sources: "LinkedIn, company blog",
    },
  ],
  statuses: { 1: "pending", 2: "pending", 3: "rejected" },
  drafts: {
    1: "Hi Priya,\n\nI noticed Northwind Robotics has been scaling its outbound team...",
    2: "Hi Marcus,\n\nCongrats on the raise — saw Fieldstack is scaling the sales team...",
    3: "Hi Dana,\n\nVantage Metrics' outbound content is already strong, but...",
  },
  feedback: { 3: "Already contacted" },
};

const meta = {
  title: "Organisms/LeadSourcerHome",
  component: LeadSourcerHome,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeadSourcerHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: { employeeId },
  render: (args) => {
    sessionStorage.setItem(`day:${args.employeeId}`, JSON.stringify(mockDay));
    return <LeadSourcerHome {...args} />;
  },
};

export const Empty: Story = {
  args: { employeeId: "story-lead-sourcer-empty" },
  render: (args) => {
    sessionStorage.removeItem(`day:${args.employeeId}`);
    return <LeadSourcerHome {...args} />;
  },
};
