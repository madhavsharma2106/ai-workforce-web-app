import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  args: {
    children: "Active",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { tone: "neutral", children: "Onboarding" },
};

export const Accent: Story = {
  args: { tone: "accent", children: "Active" },
};

export const Danger: Story = {
  args: { tone: "danger", children: "Failed" },
};

export const SizeXs: Story = {
  args: { size: "xs" },
};

export const SizeSm: Story = {
  args: { size: "sm" },
};

export const SizeMd: Story = {
  args: { size: "md" },
};
