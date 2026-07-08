import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./Input";

const meta = {
  title: "Atoms/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: { rows: 3 },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "e.g. We build custom video ads for B2B SaaS companies..." },
};

export const WithValue: Story = {
  args: {
    defaultValue:
      "We build custom video ads for B2B SaaS companies with weak online presence.",
  },
};

export const Disabled: Story = {
  args: { defaultValue: "Locked field", disabled: true },
};
