import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FeePlanBuilder } from '@schoolerp/ui'

const meta: Meta<typeof FeePlanBuilder> = {
  title: 'Finance/FeePlanBuilder',
  component: FeePlanBuilder,
}

export default meta
type Story = StoryObj<typeof FeePlanBuilder>

export const Default: Story = {
  args: {
    onSave: (plan) => console.log('Saved plan:', plan)
  }
}
