import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusPill } from "@schoolerp/ui";

const meta: Meta<typeof StatusPill> = {
  title: "UI/StatusPill",
  component: StatusPill,
  args: {
    status: "present",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StatusPill>;

export const Present: Story = {};

export const Absent: Story = {
  args: { status: "absent" },
};

export const Late: Story = {
  args: { status: "late" },
};
