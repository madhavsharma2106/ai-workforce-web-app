import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eyebrow } from "./Eyebrow";

const meta = {
  title: "Atoms/Eyebrow",
  component: Eyebrow,
  parameters: { layout: "centered" },
  args: {
    children: "Hire",
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {
  args: { tone: "accent" },
};

export const AccentFaint: Story = {
  args: { tone: "accent-faint" },
  decorators: [
    (Story) => (
      <div style={{ background: "#111827", padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export const Muted: Story = {
  args: { tone: "muted" },
};

export const TrackingWide: Story = {
  args: { tracking: "wide" },
};
