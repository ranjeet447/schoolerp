"use client"

import { useEffect, useState } from "react"
import { ReportCardPreviewCard, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent } from "@schoolerp/ui"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

const STORAGE_KEY = "parent.selectedChildId.results"
const asArray = (payload: any) => (Array.isArray(payload) ? payload : payload?.data || [])
const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const s = (value as { String?: string }).String
    return typeof s === "string" ? s : ""
  }
  return ""
}
const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const b = (value as { Bytes?: unknown }).Bytes
    if (typeof b === "string") return b
  }
  return ""
}

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
      const data = asArray(payload)
      const normalizedChildren = data.map((child: any) => ({
        id: uuidValue(child?.id),
        full_name: textValue(child?.full_name),
        class_name: textValue(child?.class_name),
        section_name: textValue(child?.section_name),
      }))
      setChildren(normalizedChildren)
      if (normalizedChildren.length > 0) {
        const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : ""
        const first = String(normalizedChildren[0].id)
        const selected = normalizedChildren.some((child: any) => String(child.id) === saved) ? String(saved) : first
        setSelectedChildID(selected)
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
      const data = asArray(payload)

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

  useEffect(() => {
    if (!selectedChildID) return
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, selectedChildID)
  }, [selectedChildID])

  const handleDownload = (examName: string) => {
    const exam = results.find((item) => item.examName === examName)
    if (!exam || !Array.isArray(exam.results)) {
      toast.error("No exam data available for export")
      return
    }

    const rows = [
      ["Exam", "Subject", "Marks", "Max Marks"],
      ...exam.results.map((row: any) => [examName, row.name, String(row.marks), String(row.maxMarks)]),
    ]

    const csv = rows.map((row) => row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${examName.replace(/\s+/g, "_").toLowerCase()}_results.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${examName} results`)
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
