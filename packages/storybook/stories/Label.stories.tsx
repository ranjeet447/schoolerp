import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input, Label } from "@schoolerp/ui";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="school-name">School Name</Label>
      <Input id="school-name" placeholder="Enter school name" />
    </div>
  ),
};
