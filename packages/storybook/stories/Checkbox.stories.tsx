import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox, Label } from "@schoolerp/ui";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" defaultChecked />
      <Label htmlFor="terms">Accept Terms & Conditions</Label>
    </div>
  ),
};
