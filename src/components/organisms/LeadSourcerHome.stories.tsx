import type { Meta, StoryObj } from "@storybook/react-vite";
import type { AgentRun, Lead } from "@/lib/types";
import LeadSourcerHome from "./LeadSourcerHome";

const employeeId = "story-lead-sourcer";

const mockRun: AgentRun = {
  id: "run-1",
  user_id: "user-1",
  employee_id: employeeId,
  trigger: "manual",
  status: "completed",
  summary:
    "Focused on Series B-C SaaS teams that just posted SDR openings — a good signal they're ramping outbound and could use help with creative.",
  job_id: null,
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const mockLeads: Lead[] = [
  {
    id: "lead-1",
    company: "Northwind Robotics",
    website: "northwindrobotics.com",
    fit: "Series B SaaS company with a growing outbound sales team and no in-house video capability.",
    decisionMaker: "Priya Shah, VP Marketing",
    email: "priya@northwindrobotics.com",
    draft: "Hi Priya,\n\nI noticed Northwind Robotics has been scaling its outbound team...",
    sources: "Apollo.io; company site",
    status: "pending",
  },
  {
    id: "lead-2",
    company: "Fieldstack",
    website: "fieldstack.io",
    fit: "Recently raised a Series A, hiring 3 SDRs, no video presence on their site.",
    decisionMaker: "Marcus Lee, Head of Growth",
    email: "",
    draft: "Hi Marcus,\n\nCongrats on the raise — saw Fieldstack is scaling the sales team...",
    sources: "Apollo.io",
    personId: "person_fieldstack",
    emailRevealed: false,
    status: "pending",
  },
  {
    id: "lead-3",
    company: "Vantage Metrics",
    website: "vantagemetrics.com",
    fit: "Mature analytics platform, strong existing outbound motion.",
    decisionMaker: "Dana Ruiz, VP Sales",
    email: "dana@vantagemetrics.com",
    draft: "Hi Dana,\n\nVantage Metrics' outbound content is already strong, but...",
    sources: "Apollo.io; company site",
    status: "rejected",
    feedbackReason: "Already contacted",
  },
];

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
  args: {
    employeeId,
    initialRun: mockRun,
    initialLeads: mockLeads,
    initialResearchedCount: 32,
  },
};

export const Researching: Story = {
  args: {
    employeeId,
    initialRun: { ...mockRun, status: "running", summary: null },
    initialLeads: [],
    initialResearchedCount: 0,
  },
};

export const Empty: Story = {
  args: {
    employeeId: "story-lead-sourcer-empty",
    initialRun: null,
    initialLeads: [],
    initialResearchedCount: 0,
  },
};
