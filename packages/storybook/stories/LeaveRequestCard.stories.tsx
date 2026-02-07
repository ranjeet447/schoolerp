import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LeaveRequestCard } from '@schoolerp/ui'

const meta: Meta<typeof LeaveRequestCard> = {
  title: 'Attendance/LeaveRequestCard',
  component: LeaveRequestCard,
}

export default meta
type Story = StoryObj<typeof LeaveRequestCard>

export const Pending: Story = {
  args: {
    studentName: 'Aarav Sharma',
    admissionNumber: 'SCH-2025-042',
    from: '2025-06-10',
    to: '2025-06-12',
    reason: 'Family function at hometown.',
    status: 'pending',
    onApprove: () => alert('Approved'),
    onReject: () => alert('Rejected')
  }
}

export const Approved: Story = {
  args: {
    studentName: 'Ishani Roy',
    admissionNumber: 'SCH-2025-088',
    from: '2025-06-05',
    to: '2025-06-05',
    reason: 'Mild fever and cough.',
    status: 'approved'
  }
}
