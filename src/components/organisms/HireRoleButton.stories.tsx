import type { Meta, StoryObj } from "@storybook/react-vite";
import { Target, Users } from "lucide-react";
import { withAppRouterMock } from "../../../.storybook/decorators";
import HireRoleButton from "./HireRoleButton";

const meta = {
  title: "Organisms/HireRoleButton",
  component: HireRoleButton,
  parameters: { layout: "centered" },
  decorators: [
    withAppRouterMock,
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HireRoleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LeadSourcer: Story = {
  args: {
    role: "lead_sourcer",
    title: "Lead Sourcer",
    description:
      "Researches prospects and drafts personalized outreach emails for your approval.",
    icon: Target,
  },
};

export const AccountManager: Story = {
  args: {
    role: "account_manager",
    title: "Account Manager",
    description:
      "Keeps your Business Profile current so every employee you hire understands your business.",
    icon: Users,
  },
};
