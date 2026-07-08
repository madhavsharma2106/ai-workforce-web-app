import type { Meta, StoryObj } from "@storybook/react-vite";
import type { UIMessage } from "ai";
import TestChat from "./TestChat";

const initialMessages: UIMessage[] = [
  {
    id: "1",
    role: "user",
    parts: [{ type: "text", text: "What did you find today?" }],
  },
  {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I researched 32 companies and drafted outreach for 3 qualified leads — take a look at the review queue when you get a chance.",
      },
    ],
  },
];

const meta = {
  title: "Organisms/TestChat",
  component: TestChat,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    employeeId: "story-employee-id",
    employeeName: "Emma",
    initialMessages,
  },
} satisfies Meta<typeof TestChat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
