import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppRouterMock } from "../../../.storybook/decorators";
import EmployeeOnboarding from "./EmployeeOnboarding";

const meta = {
  title: "Organisms/EmployeeOnboarding",
  component: EmployeeOnboarding,
  parameters: { layout: "centered" },
  decorators: [
    withAppRouterMock,
    (Story) => (
      <div style={{ width: 420, height: 520 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    employeeId: "story-employee-id",
  },
} satisfies Meta<typeof EmployeeOnboarding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LeadSourcer: Story = {
  args: { role: "lead_sourcer" },
};

export const AccountManager: Story = {
  args: { role: "account_manager" },
};

export const SalesRepresentative: Story = {
  args: { role: "sales_representative" },
};
