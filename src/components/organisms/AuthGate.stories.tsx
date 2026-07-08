import type { Meta, StoryObj } from "@storybook/react-vite";
import AuthGate from "./AuthGate";

const meta = {
  title: "Organisms/AuthGate",
  component: AuthGate,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
