import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "@schoolerp/ui";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="max-w-md space-y-3">
      <p>Top section</p>
      <Separator />
      <p>Bottom section</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center gap-3">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
