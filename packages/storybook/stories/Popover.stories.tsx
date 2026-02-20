import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@schoolerp/ui";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">This popover shows contextual actions.</p>
      </PopoverContent>
    </Popover>
  ),
};
