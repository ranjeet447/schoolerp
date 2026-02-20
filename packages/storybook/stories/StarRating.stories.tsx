import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StarRating } from "@schoolerp/ui";

const meta: Meta<typeof StarRating> = {
  title: "UI/StarRating",
  component: StarRating,
  args: {
    rating: 4,
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StarRating>;

export const Interactive: Story = {};

export const ReadOnly: Story = {
  args: {
    readonly: true,
    rating: 5,
  },
};
