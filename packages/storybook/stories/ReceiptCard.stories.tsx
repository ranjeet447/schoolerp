import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ReceiptCard } from '@schoolerp/ui'

const meta: Meta<typeof ReceiptCard> = {
  title: 'Finance/ReceiptCard',
  component: ReceiptCard,
}

export default meta
type Story = StoryObj<typeof ReceiptCard>

export const Issued: Story = {
  args: {
    receiptNumber: 'REC/2025/0001',
    studentName: 'Aarav Sharma',
    amount: 12500,
    date: '2025-06-01',
    mode: 'cash',
    status: 'issued',
    onDownload: () => alert('Downloading PDF...'),
    onCancel: () => alert('Cancel request initiated')
  }
}

export const Cancelled: Story = {
  args: {
    receiptNumber: 'REC/2025/0002',
    studentName: 'Ishani Roy',
    amount: 5000,
    date: '2025-06-02',
    mode: 'online',
    status: 'cancelled'
  }
}
