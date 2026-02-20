import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from "@schoolerp/ui";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Monthly Report</CardTitle>
        <CardDescription>Operational summary for current billing cycle.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Collections are up 12.5% month-over-month.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">View Details</Button>
      </CardFooter>
    </Card>
  ),
};
