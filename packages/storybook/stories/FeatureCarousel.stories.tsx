import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeatureCarousel } from "@schoolerp/ui";

const meta: Meta<typeof FeatureCarousel> = {
  title: "UI/FeatureCarousel",
  component: FeatureCarousel,
  args: {
    slides: [
      {
        id: "s1",
        title: "Attendance Automation",
        description: "Track class-level attendance and notify stakeholders instantly.",
        icon: "CalendarCheck",
        color: "bg-indigo-500",
        slug: "attendance",
      },
      {
        id: "s2",
        title: "Fee Intelligence",
        description: "Visualize collections and overdue trends in real time.",
        icon: "BarChart3",
        color: "bg-emerald-500",
        slug: "finance",
      },
    ],
  },
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FeatureCarousel>;

export const Default: Story = {};
