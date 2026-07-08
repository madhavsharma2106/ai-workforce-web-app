import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmployeeAvatar } from "./EmployeeAvatar";

const meta = {
  title: "Atoms/EmployeeAvatar",
  component: EmployeeAvatar,
  parameters: { layout: "centered" },
  args: {
    seed: "emma-lead-sourcer",
  },
} satisfies Meta<typeof EmployeeAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: "sm" },
};

export const Medium: Story = {
  args: { size: "md" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const DifferentSeeds: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12 }}>
      <EmployeeAvatar seed="emma-lead-sourcer" />
      <EmployeeAvatar seed="alex-account-manager" />
      <EmployeeAvatar seed="you" />
      <EmployeeAvatar seed="a-fourth-employee" />
    </div>
  ),
};
