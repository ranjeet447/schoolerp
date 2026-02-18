"use client"

import { useEffect, useState } from "react"
import { NoticeCard, Card, CardContent } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchNotices = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient("/teacher/notices")
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load notices")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []
      setNotices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notices")
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">School Notices</h1>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {loading && <div className="text-sm text-muted-foreground">Loading notices...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {notices.map((notice) => (
          <NoticeCard
            key={String(notice.id)}
            title={String(notice.title || "Untitled Notice")}
            body={String(notice.body || "")}
            author={String(notice.author || notice.created_by_name || "School Admin")}
            date={String(notice.date || notice.created_at || "")}
            isRead
          />
        ))}
      </div>

      {!loading && notices.length === 0 && (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
          No notices available.
        </div>
      )}
    </div>
  )
}
