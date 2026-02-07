import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PricingTable } from '@schoolerp/ui';

const meta: Meta<typeof PricingTable> = {
  title: 'Marketing/PricingTable',
  component: PricingTable,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PricingTable>;

export const Default: Story = {};
