import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading } from "./Heading";

const meta = {
  title: "Atoms/Heading",
  component: Heading,
  parameters: { layout: "centered" },
  args: {
    children: "Your team",
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Xl: Story = {
  args: { size: "xl" },
};

export const Lg: Story = {
  args: { size: "lg", as: "h1" },
};

export const Md: Story = {
  args: { size: "md", as: "h2" },
};

export const Sm: Story = {
  args: { size: "sm", as: "h3" },
};
