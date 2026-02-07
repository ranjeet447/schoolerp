import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImportStepper } from "@schoolerp/ui";

const steps = [
  { id: 1, title: "Upload", description: "Upload CSV file" },
  { id: 2, title: "Validate", description: "Validate data" },
  { id: 3, title: "Import", description: "Create records" },
];

const meta: Meta<typeof ImportStepper> = {
  title: "SIS/ImportStepper",
  component: ImportStepper,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ImportStepper>;

export const Step1: Story = {
  args: {
    steps: steps,
    currentStep: 1,
  },
};

export const Step2: Story = {
  args: {
    steps: steps,
    currentStep: 2,
  },
};

export const Step3: Story = {
  args: {
    steps: steps,
    currentStep: 3,
  },
};

export const Completed: Story = {
  args: {
    steps: steps,
    currentStep: 4,
  },
};
