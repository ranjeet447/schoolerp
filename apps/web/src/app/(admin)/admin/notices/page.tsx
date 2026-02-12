"use client"

import { useState, useEffect } from "react"
import { NoticeCard, TargetSelector, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Badge } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

const SCOPES = [
  { value: "all", label: "All School" },
  { value: "class_10", label: "Grade 10" },
  { value: "class_11", label: "Grade 11" },
  { value: "section_a", label: "Section A" },
]

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [scope, setScope] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const res = await apiClient("/admin/notices")
      if (res.ok) {
        const data = await res.json()
        setNotices(data || [])
      }
    } catch (err) {
      console.error("Failed to fetch notices", err)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiClient("/admin/notices", {
        method: "POST",
        body: JSON.stringify({ title, body, scope })
      })
      if (res.ok) {
        toast.success("Notice published successfully")
        fetchNotices()
        setTitle("")
        setBody("")
        setScope("")
      }
    } catch (err) {
      toast.error("Failed to publish notice")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Notices & Circulars</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-blue-50">
            <CardHeader>
              <CardTitle>Create New Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g. Annual Day Notice" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <TargetSelector 
                    targets={SCOPES} 
                    value={scope} 
                    onChange={setScope} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea 
                    placeholder="Type your message here..." 
                    className="min-h-[150px]"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? "Publishing..." : "Publish Notice"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Recent Notices</h2>
          {notices.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
              No notices published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map(n => (
                <NoticeCard key={n.id} {...n} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
