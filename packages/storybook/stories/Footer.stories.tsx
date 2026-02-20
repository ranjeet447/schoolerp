import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Footer } from "@schoolerp/ui";

const meta: Meta<typeof Footer> = {
  title: "UI/Footer",
  component: Footer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
