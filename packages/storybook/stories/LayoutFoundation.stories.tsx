import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Container, Section } from "@schoolerp/ui";

const meta: Meta<typeof Section> = {
  title: "UI/LayoutFoundation",
  component: Section,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  render: () => (
    <Section className="bg-muted/30">
      <Container>
        <div className="rounded border bg-background p-6">
          <h3 className="text-lg font-semibold">Section + Container</h3>
          <p className="text-sm text-muted-foreground">Reusable spacing primitives for landing and dashboard layouts.</p>
        </div>
      </Container>
    </Section>
  ),
};
