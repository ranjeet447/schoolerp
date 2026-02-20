import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UseCaseGrid } from "@schoolerp/ui";

const meta: Meta<typeof UseCaseGrid> = {
  title: "UI/UseCaseGrid",
  component: UseCaseGrid,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UseCaseGrid>;

export const Default: Story = {};
