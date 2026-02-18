"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

export default function ParentHomeworkPage() {
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildID, setSelectedChildID] = useState("")
  const [homework, setHomework] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchChildren = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient("/parent/me/children")
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load children")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []
      setChildren(data)
      if (data.length > 0) {
        setSelectedChildID(String(data[0].id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load children")
      setChildren([])
    } finally {
      setLoading(false)
    }
  }

  const fetchHomework = async (childID: string) => {
    if (!childID) {
      setHomework([])
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await apiClient(`/parent/homework?student_id=${encodeURIComponent(childID)}`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load homework")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []
      setHomework(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load homework")
      setHomework([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChildID) {
      fetchHomework(selectedChildID)
    }
  }, [selectedChildID])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Homework</h1>
        <p className="text-muted-foreground">Track classwork and homework updates for your child.</p>
      </div>

      <div className="max-w-sm">
        <Select value={selectedChildID} onValueChange={setSelectedChildID}>
          <SelectTrigger>
            <SelectValue placeholder="Select child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={String(child.id)} value={String(child.id)}>
                {child.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
      {loading && <div className="text-sm text-muted-foreground">Loading homework...</div>}

      {!loading && homework.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
          No homework assigned yet.
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map((item) => (
            <Card key={String(item.id)}>
              <CardHeader>
                <CardTitle className="text-base">{String(item.title || "Untitled")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{String(item.description || "No details")}</p>
                <p><span className="font-medium">Due:</span> {String(item.due_date || "-")}</p>
                {item.subject_name && <p><span className="font-medium">Subject:</span> {String(item.subject_name)}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
