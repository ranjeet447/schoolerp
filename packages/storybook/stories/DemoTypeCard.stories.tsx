import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DemoTypeCard } from '@schoolerp/ui';

const meta: Meta<typeof DemoTypeCard> = {
  title: 'Booking/DemoTypeCard',
  component: DemoTypeCard,
};

export default meta;
type Story = StoryObj<typeof DemoTypeCard>;

export const Default: Story = {
  args: {
    name: 'Academic Panel Walkthrough',
    duration: 30,
    description: 'A complete guided tour of the student information system, attendance, and exam modules.',
    onSelect: () => alert('Selected'),
  },
};
