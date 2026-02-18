"use client"

import { useEffect, useState } from "react"
import { ReportCardPreviewCard, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent } from "@schoolerp/ui"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function ParentResultsPage() {
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildID, setSelectedChildID] = useState("")
  const [results, setResults] = useState<any[]>([])
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
      const message = err instanceof Error ? err.message : "Failed to load children"
      setError(message)
      setChildren([])
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async (childID: string) => {
    if (!childID) {
      setResults([])
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await apiClient(`/parent/children/${childID}/exams/results`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load exam results")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []

      const grouped = new Map<string, { examName: string; results: Array<{ name: string; marks: number; maxMarks: number }> }>()
      for (const row of data) {
        const examName = String(row.exam_name || row.examName || "Exam")
        if (!grouped.has(examName)) {
          grouped.set(examName, { examName, results: [] })
        }
        grouped.get(examName)?.results.push({
          name: String(row.subject_name || row.subject || "Subject"),
          marks: Number(row.marks_obtained ?? row.marks ?? row.score ?? 0),
          maxMarks: Number(row.max_marks ?? row.maxMarks ?? 100),
        })
      }

      setResults(Array.from(grouped.values()))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load exam results"
      setError(message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChildID) {
      fetchResults(selectedChildID)
    }
  }, [selectedChildID])

  const handleDownload = (examName: string) => {
    toast.info(`Downloading report card for ${examName}...`)
  }

  const selectedChild = children.find((child) => String(child.id) === selectedChildID)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Academic Results</h1>
        <p className="text-gray-500 font-medium">
          {selectedChild ? `${selectedChild.full_name || "Student"} • ${(selectedChild.class_name || "N/A")} ${(selectedChild.section_name ? `- ${selectedChild.section_name}` : "")}` : "Select a child to view results"}
        </p>
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

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {loading && <div className="text-sm text-muted-foreground">Loading results...</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {results.map((exam, idx) => (
          <ReportCardPreviewCard 
            key={idx}
            examName={exam.examName}
            results={exam.results}
            onDownload={() => handleDownload(exam.examName)}
          />
        ))}
      </div>

      {!loading && results.length === 0 && (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
          No published results available.
        </div>
      )}
    </div>
  )
}
