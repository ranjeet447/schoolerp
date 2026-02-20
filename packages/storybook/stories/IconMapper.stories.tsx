import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IconMapper } from "@schoolerp/ui";

const meta: Meta<typeof IconMapper> = {
  title: "UI/IconMapper",
  component: IconMapper,
  args: {
    name: "ShieldCheck",
    size: 32,
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof IconMapper>;

export const Default: Story = {};

export const Fallback: Story = {
  args: {
    name: "UnknownIconName",
  },
};
