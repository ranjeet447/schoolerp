import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SlotPicker } from '@schoolerp/ui';

const meta: Meta<typeof SlotPicker> = {
  title: 'Booking/SlotPicker',
  component: SlotPicker,
};

export default meta;
type Story = StoryObj<typeof SlotPicker>;

export const Default: Story = {
  args: {
    availableSlots: [
      '2026-02-01T10:00:00Z',
      '2026-02-01T10:30:00Z',
      '2026-02-01T11:00:00Z',
      '2026-02-02T14:00:00Z',
      '2026-02-02T14:30:00Z',
    ],
    onSelect: (slot) => console.log('Selected:', slot),
  },
};
