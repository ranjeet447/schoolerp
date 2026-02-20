import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeatureTabs } from "@schoolerp/ui";

const meta: Meta<typeof FeatureTabs> = {
  title: "UI/FeatureTabs",
  component: FeatureTabs,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FeatureTabs>;

export const Default: Story = {};
