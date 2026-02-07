import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MarksGrid } from '@schoolerp/ui'

const meta: Meta<typeof MarksGrid> = {
  title: 'Exams/MarksGrid',
  component: MarksGrid,
}

export default meta
type Story = StoryObj<typeof MarksGrid>

export const Default: Story = {
  args: {
    maxMarks: 100,
    students: [
      { id: '1', name: 'Aarav Sharma', marks: 85 },
      { id: '2', name: 'Ishani Roy', marks: 25 },
      { id: '3', name: 'Kabir Singh', marks: 95 },
      { id: '4', name: 'Saira Banu', marks: 45 },
    ],
    onMarksChange: (id, marks) => console.log(`Student ${id} marks changed to ${marks}`)
  }
}
