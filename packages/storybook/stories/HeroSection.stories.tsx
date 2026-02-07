import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroSection } from '@schoolerp/ui';

const meta: Meta<typeof HeroSection> = {
  title: 'Marketing/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof HeroSection>;

export const Default: Story = {};
