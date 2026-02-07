import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TestimonialSection } from '@schoolerp/ui';

const meta: Meta<typeof TestimonialSection> = {
  title: 'Marketing/TestimonialSection',
  component: TestimonialSection,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TestimonialSection>;

export const Default: Story = {};
