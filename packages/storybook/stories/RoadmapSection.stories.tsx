import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RoadmapSection } from "@schoolerp/ui";

const meta: Meta<typeof RoadmapSection> = {
  title: "UI/RoadmapSection",
  component: RoadmapSection,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RoadmapSection>;

export const Default: Story = {};
