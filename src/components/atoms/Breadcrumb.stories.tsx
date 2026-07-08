import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "./Breadcrumb";

const meta = {
  title: "Atoms/Breadcrumb",
  component: Breadcrumb,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCrumb: Story = {
  args: {
    items: [{ label: "Dashboard", href: "/dashboard" }],
  },
};

export const TwoLevels: Story = {
  args: {
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Emma" },
    ],
  },
};

export const ThreeLevels: Story = {
  args: {
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Emma", href: "/employee/123" },
      { label: "Chat" },
    ],
  },
};
