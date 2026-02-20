import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@schoolerp/ui";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Click me",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Large: Story = {
  args: { size: "lg", children: "Large Action" },
};
