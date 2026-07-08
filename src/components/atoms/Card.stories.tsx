import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";
import { Text } from "./Text";

const meta = {
  title: "Atoms/Card",
  component: Card,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    children: <Text>Card content goes here.</Text>,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PaddingSmall: Story = {
  args: { padding: "sm" },
};

export const PaddingMedium: Story = {
  args: { padding: "md" },
};

export const PaddingNone: Story = {
  args: { padding: "none", children: <Text className="p-3">No card padding.</Text> },
};

export const AsSection: Story = {
  args: { as: "section" },
};
