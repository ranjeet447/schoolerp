import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookingTable } from "@schoolerp/ui";

const sampleBookings = [
  {
    id: "b-1",
    name: "Ravi Menon",
    email: "ravi@example.com",
    school_name: "Northfield School",
    start_at: new Date().toISOString(),
    status: "confirmed" as const,
  },
  {
    id: "b-2",
    name: "Asha Verma",
    email: "asha@example.com",
    school_name: "Riverdale Academy",
    start_at: new Date(Date.now() + 86400000).toISOString(),
    status: "pending" as const,
  },
];

const meta: Meta<typeof BookingTable> = {
  title: "UI/BookingTable",
  component: BookingTable,
  args: {
    bookings: sampleBookings,
    onAction: () => {},
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BookingTable>;

export const Default: Story = {};

export const Empty: Story = {
  args: { bookings: [] },
};
