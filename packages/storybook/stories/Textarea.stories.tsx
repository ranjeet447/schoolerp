import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "@schoolerp/ui";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  args: {
    placeholder: "Write your note...",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: "This is a sample multiline message.",
  },
};
