import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@schoolerp/ui";

const meta: Meta<typeof Command> = {
  title: "UI/Command",
  component: Command,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <div className="max-w-md rounded border">
      <Command>
        <CommandInput placeholder="Search command..." />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem value="new-tenant">Create Tenant</CommandItem>
            <CommandItem value="open-incidents">Open Incidents</CommandItem>
            <CommandItem value="billing">Billing Overview</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
};
