import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@schoolerp/ui";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "Type here...",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    value: "Disabled value",
    disabled: true,
  },
};
