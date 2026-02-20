import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Navbar } from "@schoolerp/ui";

const meta: Meta<typeof Navbar> = {
  title: "UI/Navbar",
  component: Navbar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {};
