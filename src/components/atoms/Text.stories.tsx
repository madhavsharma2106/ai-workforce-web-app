import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "./Text";

const meta = {
  title: "Atoms/Text",
  component: Text,
  parameters: { layout: "centered" },
  args: {
    children: "Emma is researching prospects and drafting outreach.",
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Muted: Story = {
  args: { tone: "muted" },
};

export const Subtle: Story = {
  args: { tone: "subtle" },
};

export const Inverted: Story = {
  args: { tone: "inverted" },
  decorators: [
    (Story) => (
      <div style={{ background: "#111827", padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Text size="xs">xs — Emma is researching prospects.</Text>
      <Text size="sm">sm — Emma is researching prospects.</Text>
      <Text size="md">md — Emma is researching prospects.</Text>
      <Text size="lg">lg — Emma is researching prospects.</Text>
      <Text size="xl">xl — Emma is researching prospects.</Text>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Text weight="normal">Normal weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">Semibold weight</Text>
    </div>
  ),
};
