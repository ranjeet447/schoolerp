import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress } from "@schoolerp/ui";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  args: {
    value: 66,
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {};

export const Complete: Story = {
  args: { value: 100 },
};
