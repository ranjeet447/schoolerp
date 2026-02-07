import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { NoticeCard } from '@schoolerp/ui'

const meta: Meta<typeof NoticeCard> = {
  title: 'Notices/NoticeCard',
  component: NoticeCard,
}

export default meta
type Story = StoryObj<typeof NoticeCard>

export const Unread: Story = {
  args: {
    title: 'School Annual Day Celebration',
    body: 'We are pleased to announce that the Annual Day celebration will be held on June 15th. All parents are cordially invited to attend the event at the school auditorium.',
    author: 'Principal Office',
    date: '2025-06-01',
    isRead: false,
    onAcknowledge: () => alert('Acknowledged!')
  }
}

export const Read: Story = {
  args: {
    title: 'Summer Vacation Notice',
    body: 'The school will remain closed for summer vacation from May 1st to June 10th. Classes will resume on June 11th.',
    author: 'Admin',
    date: '2025-04-25',
    isRead: true
  }
}

export const AdminView: Story = {
  args: {
    title: 'New Policy Update',
    body: 'Please review the updated attendance policy in the school handbook.',
    author: 'Management',
    date: '2025-05-10',
    showAckStatus: true,
    ackCount: 145
  }
}
