import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FeatureGrid } from '@schoolerp/ui';

const meta: Meta<typeof FeatureGrid> = {
  title: 'Marketing/FeatureGrid',
  component: FeatureGrid,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FeatureGrid>;

export const Default: Story = {};
