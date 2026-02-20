import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TargetSelector } from "@schoolerp/ui";

const meta: Meta<typeof TargetSelector> = {
  title: "UI/TargetSelector",
  component: TargetSelector,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TargetSelector>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("all");
    return (
      <div className="w-80">
        <TargetSelector
          targets={[
            { value: "all", label: "All Students" },
            { value: "class-8", label: "Class 8" },
            { value: "class-9", label: "Class 9" },
          ]}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};
