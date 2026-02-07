import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StudentProfileCard } from "@schoolerp/ui";

const meta: Meta<typeof StudentProfileCard> = {
  title: "SIS/StudentProfileCard",
  component: StudentProfileCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StudentProfileCard>;

export const Active: Story = {
  args: {
    student: {
      id: "1",
      admission_number: "2024001",
      full_name: "John Doe",
      date_of_birth: "2010-05-15",
      gender: "Male",
      class_name: "10th Grade",
      section_name: "A",
      status: "active",
      address: "123 School Lane, Springfield",
    },
  },
};

export const Inactive: Story = {
  args: {
    student: {
      id: "2",
      admission_number: "2024002",
      full_name: "Jane Smith",
      date_of_birth: "2011-08-20",
      gender: "Female",
      class_name: "9th Grade",
      section_name: "B",
      status: "inactive",
      address: "456 Education Rd, Springfield",
    },
  },
};
