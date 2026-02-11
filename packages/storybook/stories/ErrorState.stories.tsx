import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorState } from '@schoolerp/ui';

const meta: Meta<typeof ErrorState> = {
  title: 'Feedback/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['error', 'offline', '404', 'server'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const GenericError: Story = {
  args: {
    type: 'error',
    onRetry: () => alert('Retrying...'),
    onGoHome: () => alert('Going home...'),
  },
};

export const Offline: Story = {
  args: {
    type: 'offline',
    onRetry: () => alert('Retrying connection...'),
  },
};

export const NotFound: Story = {
  args: {
    type: '404',
    onGoHome: () => alert('Going home...'),
  },
};

export const ServerError: Story = {
  args: {
    type: 'server',
    onRetry: () => alert('Retrying...'),
    onGoHome: () => alert('Going home...'),
  },
};

export const CustomMessage: Story = {
  args: {
    type: 'error',
    title: 'Payment Failed',
    description: 'We were unable to process your payment. Please check your card details and try again.',
    onRetry: () => alert('Retrying payment...'),
  },
};
