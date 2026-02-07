import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DataTable } from "@schoolerp/ui";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

const data = [
  { id: "1", name: "Alice", email: "alice@example.com", status: "active" },
  { id: "2", name: "Bob", email: "bob@example.com", status: "inactive" },
  { id: "3", name: "Charlie", email: "charlie@example.com", status: "active" },
];

const meta: Meta<typeof DataTable> = {
  title: "UI/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
  args: {
    columns: columns,
    data: data,
  },
};

export const Empty: Story = {
  args: {
    columns: columns,
    data: [],
  },
};
