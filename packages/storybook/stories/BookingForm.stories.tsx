import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookingForm } from "@schoolerp/ui";

const meta: Meta<typeof BookingForm> = {
  title: "UI/BookingForm",
  component: BookingForm,
  args: {
    onSubmit: async () => {},
    status: "idle",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BookingForm>;

export const Default: Story = {};

export const Loading: Story = {
  args: { status: "loading" },
};
