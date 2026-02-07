import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ReportCardPreviewCard } from '@schoolerp/ui'

const meta: Meta<typeof ReportCardPreviewCard> = {
  title: 'Exams/ReportCardPreviewCard',
  component: ReportCardPreviewCard,
}

export default meta
type Story = StoryObj<typeof ReportCardPreviewCard>

export const Default: Story = {
  args: {
    examName: 'Final Term Examination 2025',
    results: [
      { name: 'Mathematics', marks: 92, maxMarks: 100 },
      { name: 'Science', marks: 88, maxMarks: 100 },
      { name: 'English', marks: 75, maxMarks: 100 },
      { name: 'History', marks: 45, maxMarks: 100 },
      { name: 'Geography', marks: 30, maxMarks: 100 },
    ],
    onDownload: () => alert('Generating Report Card PDF...')
  }
}
