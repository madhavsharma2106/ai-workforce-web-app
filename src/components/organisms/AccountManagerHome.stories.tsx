import type { Meta, StoryObj } from "@storybook/react-vite";
import AccountManagerHome from "./AccountManagerHome";

const filledProfileMd = `## Business
We build custom video ads for B2B SaaS companies.

## Ideal client
Series A-C SaaS companies with a sales team of 5+.

## Bad-fit criteria
Agencies, consumer brands, companies too small to afford us.

## Value proposition
Faster turnaround and better creative than in-house teams.

## Tone
Direct, no-fluff.

## Current priorities
Push for Q3 renewals before the pricing change.`;

const meta = {
  title: "Organisms/AccountManagerHome",
  component: AccountManagerHome,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    employeeId: "story-account-manager",
  },
} satisfies Meta<typeof AccountManagerHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    businessName: "Northwind Creative",
    contactName: "Jordan Reyes",
    profileMd: filledProfileMd,
    updatedAt: new Date().toISOString(),
  },
};

export const Empty: Story = {
  args: {
    businessName: null,
    contactName: null,
    profileMd: "",
    updatedAt: null,
  },
};
