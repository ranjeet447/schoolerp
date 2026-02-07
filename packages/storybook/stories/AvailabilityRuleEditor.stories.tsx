import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AvailabilityRuleEditor } from '@schoolerp/ui';

const meta: Meta<typeof AvailabilityRuleEditor> = {
  title: 'Admin/AvailabilityRuleEditor',
  component: AvailabilityRuleEditor,
};

export default meta;
type Story = StoryObj<typeof AvailabilityRuleEditor>;

export const Default: Story = {
  args: {
    rules: [
      { id: '1', day_of_week: 1, start_time: '10:00', end_time: '18:00', is_active: true },
    ],
    onSave: async (rules) => {
      console.log('Saving rules:', rules);
    },
  },
};
