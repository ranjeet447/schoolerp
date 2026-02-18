"use client"

import { useEffect, useState } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function TeacherHomeworkPage() {
  const [classSectionID, setClassSectionID] = useState("")
  const [subjectID, setSubjectID] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [homework, setHomework] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const fetchHomework = async (sectionID: string) => {
    if (!sectionID) {
      setHomework([])
      return
    }
    setFetching(true)
    try {
      const res = await apiClient(`/teacher/homework/section/${encodeURIComponent(sectionID)}`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load homework")
      }
      const payload = await res.json()
      setHomework(Array.isArray(payload) ? payload : payload?.data || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load homework")
      setHomework([])
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (classSectionID) fetchHomework(classSectionID)
  }, [classSectionID])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classSectionID || !subjectID || !title || !dueDate) {
      toast.error("Class section, subject, title and due date are required")
      return
    }

    setLoading(true)
    try {
      const res = await apiClient("/teacher/homework", {
        method: "POST",
        body: JSON.stringify({
          class_section_id: classSectionID,
          subject_id: subjectID,
          title,
          description,
          due_date: `${dueDate}T00:00:00Z`,
          attachments: [],
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to create homework")
      }

      setTitle("")
      setDescription("")
      setDueDate("")
      toast.success("Homework posted")
      await fetchHomework(classSectionID)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create homework")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Post Homework</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Class Section ID</Label>
                <Input placeholder="UUID of class section" value={classSectionID} onChange={(e) => setClassSectionID(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Subject ID</Label>
                <Input placeholder="UUID of subject" value={subjectID} onChange={(e) => setSubjectID(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Homework title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Instructions for students" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Homework"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold">Recent Homework</h2>
        {fetching ? (
          <div className="text-sm text-muted-foreground">Loading homework...</div>
        ) : homework.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
            No homework found for this section.
          </div>
        ) : (
          <div className="space-y-3">
            {homework.map((item) => (
              <Card key={String(item.id)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{String(item.title || "Untitled")}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{String(item.description || "No description")}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Due: {String(item.due_date || "-")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
