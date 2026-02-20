import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeatureMockup } from "@schoolerp/ui";

const meta: Meta<typeof FeatureMockup> = {
  title: "UI/FeatureMockup",
  component: FeatureMockup,
  args: {
    type: "table",
    color: "bg-indigo-500",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FeatureMockup>;

export const Table: Story = {};

export const Chart: Story = {
  args: { type: "chart", color: "bg-emerald-500" },
};

export const Map: Story = {
  args: { type: "map", color: "bg-blue-500" },
};
