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
    icon: <Target size={20} className="text-white" />,
  },
};

export const AccountManager: Story = {
  args: {
    role: "account_manager",
    title: "Account Manager",
    description:
      "Keeps your Business Profile current so every employee you hire understands your business.",
    icon: <Users size={20} className="text-white" />,
  },
};

export const SalesRepresentative: Story = {
  args: {
    role: "sales_representative",
    title: "Sales Representative",
    description:
      "Sends approved outreach and drafts follow-ups — once Emma hands off qualified leads.",
    icon: <Users size={20} className="text-white" />,
  },
};
