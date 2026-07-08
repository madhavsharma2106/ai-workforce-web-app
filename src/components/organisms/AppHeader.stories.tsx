import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppRouterMock } from "../../../.storybook/decorators";
import AppHeader from "./AppHeader";

const meta = {
  title: "Organisms/AppHeader",
  component: AppHeader,
  parameters: { layout: "fullscreen" },
  decorators: [withAppRouterMock],
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  args: { userEmail: "founder@company.com" },
};

export const NoEmail: Story = {
  args: { userEmail: null },
};
