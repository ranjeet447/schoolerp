import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FinalCTA } from '@schoolerp/ui';

const meta: Meta<typeof FinalCTA> = {
  title: 'Marketing/FinalCTA',
  component: FinalCTA,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FinalCTA>;

export const Default: Story = {};
