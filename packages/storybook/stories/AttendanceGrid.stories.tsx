import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AttendanceGrid } from '@schoolerp/ui'
import { useState } from 'react'

const meta: Meta<typeof AttendanceGrid> = {
  title: 'Attendance/AttendanceGrid',
  component: AttendanceGrid,
}

export default meta
type Story = StoryObj<typeof AttendanceGrid>

export const Default: Story = {
  render: () => {
    const [students, setStudents] = useState([
      { id: '1', name: 'John Doe', rollNumber: '101', status: 'present' as const, remarks: '' },
      { id: '2', name: 'Jane Smith', rollNumber: '102', status: 'absent' as const, remarks: 'Sick' },
      { id: '3', name: 'Mike Brown', rollNumber: '103', status: 'late' as const, remarks: '' },
    ])

    return (
      <AttendanceGrid
        students={students}
        onStatusChange={(id, status) => {
          setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s))
        }}
        onRemarksChange={(id, remarks) => {
          setStudents(prev => prev.map(s => s.id === id ? { ...s, remarks } : s))
        }}
      />
    )
  }
}

export const ReadOnly: Story = {
  args: {
    students: [
      { id: '1', name: 'John Doe', rollNumber: '101', status: 'present' as const, remarks: 'Early' },
      { id: '2', name: 'Jane Smith', rollNumber: '102', status: 'absent' as const, remarks: 'Vacation' },
    ],
    onStatusChange: () => {},
    readOnly: true
  }
}
