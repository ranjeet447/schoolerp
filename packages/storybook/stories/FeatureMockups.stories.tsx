import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeatureMockup } from "@schoolerp/ui";

const meta: Meta<typeof FeatureMockup> = {
  title: "UI/FeatureMockups",
  component: FeatureMockup,
  args: {
    type: "list",
    color: "bg-violet-500",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FeatureMockup>;

export const Default: Story = {};
