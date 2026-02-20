import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@schoolerp/ui";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  args: {
    children: "Active",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Pending" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Failed" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Draft" },
};
