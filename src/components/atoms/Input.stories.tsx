import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta = {
  title: "Atoms/Input",
  component: Input,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "you@company.com" },
};

export const WithValue: Story = {
  args: { defaultValue: "Emma's Design Studio" },
};

export const Disabled: Story = {
  args: { defaultValue: "Locked field", disabled: true },
};
