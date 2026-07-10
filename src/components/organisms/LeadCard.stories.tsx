import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Lead } from "@/lib/types";
import LeadCard from "./LeadCard";

const baseLead: Lead = {
  id: "lead-1",
  company: "Northwind Robotics",
  website: "northwindrobotics.com",
  fit: "Series B SaaS company with a growing outbound sales team and no in-house video capability.",
  decisionMaker: "Priya Shah, VP Marketing",
  email: "priya@northwindrobotics.com",
  draft:
    "Hi Priya,\n\nI noticed Northwind Robotics has been scaling its outbound team...",
  sources: "LinkedIn, company blog, Crunchbase",
  status: "pending",
};

const meta = {
  title: "Organisms/LeadCard",
  component: LeadCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    lead: baseLead,
    draftText: baseLead.draft,
    isEditing: false,
    feedbackActive: false,
    isRevealingEmail: false,
    onApprove: () => console.log("approve"),
    onReject: () => console.log("reject"),
    onToggleEdit: () => console.log("toggle edit"),
    onDraftChange: (value) => console.log("draft change", value),
    onFeedbackSubmit: (reason) => console.log("feedback", reason),
    onRevealEmail: () => console.log("reveal email"),
  },
} satisfies Meta<typeof LeadCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: { status: "pending" },
};

export const Approved: Story = {
  args: { status: "approved" },
};

export const Rejected: Story = {
  args: { status: "rejected", feedbackReason: "Wrong industry" },
};

export const Editing: Story = {
  args: { status: "pending", isEditing: true },
};

export const FeedbackActive: Story = {
  args: { status: "pending", feedbackActive: true },
};

export const EmailLocked: Story = {
  args: {
    status: "pending",
    lead: { ...baseLead, personId: "person_123", emailRevealed: false },
  },
};

export const RevealingEmail: Story = {
  args: {
    status: "pending",
    lead: { ...baseLead, personId: "person_123", emailRevealed: false },
    isRevealingEmail: true,
  },
};
