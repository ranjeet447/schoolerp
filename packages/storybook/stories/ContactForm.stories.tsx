import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContactForm } from '@schoolerp/ui';

const meta: Meta<typeof ContactForm> = {
  title: 'Marketing/ContactForm',
  component: ContactForm,
};

export default meta;
type Story = StoryObj<typeof ContactForm>;

export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    status: 'loading',
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    status: 'success',
  },
};
