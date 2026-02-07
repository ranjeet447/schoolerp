import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IntegrationCard } from '@schoolerp/ui';

const meta: Meta<typeof IntegrationCard> = {
  title: 'Growth/IntegrationCard',
  component: IntegrationCard,
};

export default meta;
type Story = StoryObj<typeof IntegrationCard>;

export const Default: Story = {
  args: {
    name: 'Razorpay',
    category: 'Payments',
    description: 'Accept school fees online with multiple payment modes including UPI, Credit Cards, and Net Banking.',
    status: 'active',
    slug: 'razorpay',
  },
};

export const ComingSoon: Story = {
  args: {
    ...Default.args,
    name: 'Tally Prime',
    category: 'Accounting',
    description: 'Directly sync your fee receipts and salary entries with Tally ERP for seamless accounting.',
    status: 'coming_soon',
    slug: 'tally',
  },
};
