import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ReviewForm } from '@schoolerp/ui';

const meta: Meta<typeof ReviewForm> = {
  title: 'Growth/ReviewForm',
  component: ReviewForm,
};

export default meta;
type Story = StoryObj<typeof ReviewForm>;

export const Default: Story = {
  args: {
    schoolName: 'Demo International School',
    onSubmit: async (data) => {
      console.log('Review submitted:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    status: 'success',
  },
};
