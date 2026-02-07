import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DownloadButtonWithStatus } from '@schoolerp/ui';

const meta: Meta<typeof DownloadButtonWithStatus> = {
  title: 'Growth/DownloadButtonWithStatus',
  component: DownloadButtonWithStatus,
};

export default meta;
type Story = StoryObj<typeof DownloadButtonWithStatus>;

export const Idle: Story = {
  args: {
    status: 'idle',
    onDownload: () => alert('Requesting PDF...'),
  },
};

export const Generating: Story = {
  args: {
    status: 'generating',
  },
};

export const Ready: Story = {
  args: {
    status: 'ready',
    onDownload: () => alert('Downloading...'),
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    onRefresh: () => alert('Retrying...'),
  },
};
