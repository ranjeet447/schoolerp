"use client"

import { useEffect, useState } from "react"
import { NoticeCard, Card, CardContent } from "@schoolerp/ui"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function ParentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchNotices = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient("/parent/notices")
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load notices")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []
      setNotices(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load notices"
      setError(message)
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleAck = async (id: string) => {
    try {
      const res = await apiClient(`/parent/notices/${id}/ack`, { method: "POST" })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to acknowledge notice")
      }

      setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      toast.success("Notice acknowledged")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to acknowledge notice")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notices & Communications</h1>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground">Loading notices...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notices.map((n) => (
          <NoticeCard 
            key={n.id} 
            title={String(n.title || "Untitled Notice")}
            body={String(n.body || "")}
            author={String(n.author || n.created_by_name || "School Admin")}
            date={String(n.date || n.created_at || "")}
            isRead={Boolean(n.isRead || n.acknowledged || n.read)}
            onAcknowledge={() => handleAck(n.id)} 
          />
        ))}
      </div>

      {!loading && notices.length === 0 && (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
          No active notices.
        </div>
      )}
    </div>
  )
}
