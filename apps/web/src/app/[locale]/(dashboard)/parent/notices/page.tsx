"use client"

import { useState } from "react"
import { NoticeCard } from "@schoolerp/ui"

export default function ParentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([
    {
      id: "1",
      title: "School Annual Day Celebration",
      body: "We are pleased to announce that the Annual Day celebration will be held on June 15th. All parents are cordially invited to attend the event at the school auditorium.",
      author: "Principal Office",
      date: "2025-06-01",
      isRead: false,
    },
    {
      id: "2",
      title: "Summer Vacation Notice",
      body: "The school will remain closed for summer vacation from May 1st to June 10th. Classes will resume on June 11th.",
      author: "Admin",
      date: "2025-04-25",
      isRead: true,
    }
  ])

  const handleAck = (id: string) => {
    setNotices(notices.map(n => n.id === id ? { ...n, isRead: true } : n))
    alert("Notice acknowledged!")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notices & Communications</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notices.map(n => (
          <NoticeCard 
            key={n.id} 
            {...n} 
            onAcknowledge={() => handleAck(n.id)} 
          />
        ))}
      </div>

      {notices.length === 0 && (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
          No active notices.
        </div>
      )}
    </div>
  )
}
