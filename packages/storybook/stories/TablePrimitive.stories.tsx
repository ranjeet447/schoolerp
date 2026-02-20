import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@schoolerp/ui";

const meta: Meta<typeof Table> = {
  title: "UI/TablePrimitive",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>School</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Global Public School</TableCell>
          <TableCell>Enterprise</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Springfield High</TableCell>
          <TableCell>Pro</TableCell>
          <TableCell>Trial</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
