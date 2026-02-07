import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FAQSection } from '@schoolerp/ui';

const meta: Meta<typeof FAQSection> = {
  title: 'Marketing/FAQSection',
  component: FAQSection,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof FAQSection>;

export const Default: Story = {};
