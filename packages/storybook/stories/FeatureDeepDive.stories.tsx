import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FeatureDeepDive } from '@schoolerp/ui';

const meta: Meta<typeof FeatureDeepDive> = {
  title: 'Marketing/FeatureDeepDive',
  component: FeatureDeepDive,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FeatureDeepDive>;

export const Default: Story = {
  args: {
    title: "Financial Control Center",
    description: "Stop revenue leakage with automated fee reminders, online payments, and tight integration with tally for accounting reconciliation.",
    badge: "Finance",
    benefits: ["Auto-reconciliation via PG integration", "Staff payroll managed in clicks", "Inventory & Asset tracking"],
    imageSide: "right"
  }
};
