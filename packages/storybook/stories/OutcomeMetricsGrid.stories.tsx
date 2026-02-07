import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OutcomeMetricsGrid } from '@schoolerp/ui';

const meta: Meta<typeof OutcomeMetricsGrid> = {
  title: 'Growth/OutcomeMetricsGrid',
  component: OutcomeMetricsGrid,
};

export default meta;
type Story = StoryObj<typeof OutcomeMetricsGrid>;

export const Default: Story = {
  args: {
    metrics: [
      { label: 'Revenue Leakage', value: '-85%', description: 'Reduction in manual fee collection errors.' },
      { label: 'Staff Productivity', value: '+40%', description: 'Time saved on administrative tasks.' },
      { label: 'Parent Satisfaction', value: '4.8/5', description: 'Based on after-onboarding survey.' },
    ],
  },
};
