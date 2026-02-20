import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarFallback, AvatarImage } from "@schoolerp/ui";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar className="h-16 w-16">
      <AvatarImage src="https://i.pravatar.cc/100?img=8" alt="User avatar" />
      <AvatarFallback>RA</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar className="h-16 w-16">
      <AvatarFallback>SE</AvatarFallback>
    </Avatar>
  ),
};
