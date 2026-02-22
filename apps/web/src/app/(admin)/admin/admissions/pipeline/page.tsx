"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, Badge, Button } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { RefreshCw, GripVertical, User, Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"

const PIPELINE_STAGES = [
  { key: "submitted", label: "Submitted", color: "bg-slate-100 border-slate-200 text-slate-700" },
  { key: "review", label: "Under Review", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "assessment", label: "Assessment", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { key: "offered", label: "Offered", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { key: "admitted", label: "Admitted", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { key: "declined", label: "Declined", color: "bg-red-50 border-red-200 text-red-700" },
]

type Application = {
  id: string
  student_name: string
  class_applied: string
  status: string
  created_at: string
  parent_name?: string
  parent_phone?: string
}

const textValue = (v: unknown) => {
  if (typeof v === "string") return v
  if (v && typeof v === "object" && "String" in v) return (v as any).String || ""
  return ""
}

const uuidValue = (v: unknown) => {
  if (typeof v === "string") return v
  if (v && typeof v === "object" && "Bytes" in v) return (v as any).Bytes || ""
  return ""
}

export default function AdmissionsKanbanPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)

  const fetchApplications = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient("/admin/admissions/applications")
      if (res.ok) {
        const data = await res.json()
        const rows = Array.isArray(data) ? data : (data?.data || [])
        setApplications(rows.map((item: any) => ({
          id: uuidValue(item.id),
          student_name: textValue(item.student_name || item.applicant_name),
          class_applied: textValue(item.class_applied || item.applied_for_class),
          status: textValue(item.status || "submitted").toLowerCase(),
          created_at: textValue(item.created_at),
          parent_name: textValue(item.parent_name || item.guardian_name),
          parent_phone: textValue(item.parent_phone || item.guardian_phone),
        })))
      }
    } catch (err) {
      console.error("Failed to load applications", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const moveToStage = async (appId: string, newStatus: string) => {
    setMovingId(appId)
    try {
      const res = await apiClient(`/admin/admissions/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
        toast.success(`Moved to ${PIPELINE_STAGES.find(s => s.key === newStatus)?.label}`)
      } else {
        toast.error("Failed to update status")
      }
    } catch {
      toast.error("Failed to update status")
    } finally {
      setMovingId(null)
    }
  }

  const getAppsForStage = (stageKey: string) =>
    applications.filter(a => a.status === stageKey)

  const getNextStage = (currentStage: string) => {
    const idx = PIPELINE_STAGES.findIndex(s => s.key === currentStage)
    if (idx >= 0 && idx < PIPELINE_STAGES.length - 1) return PIPELINE_STAGES[idx + 1]
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admission Pipeline</h1>
          <p className="text-muted-foreground mt-1">Drag-and-drop style Kanban board for managing applications</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/admissions/applications">
            <Button variant="outline" size="sm" className="gap-2">Table View</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => fetchApplications(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-2">
        {PIPELINE_STAGES.map(stage => {
          const count = getAppsForStage(stage.key).length
          return (
            <Badge key={stage.key} variant="secondary" className={`px-3 py-1.5 text-xs font-bold ${stage.color}`}>
              {stage.label}: {count}
            </Badge>
          )
        })}
        <Badge variant="secondary" className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary">
          Total: {applications.length}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading pipeline...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-h-[60vh]">
          {PIPELINE_STAGES.map(stage => {
            const stageApps = getAppsForStage(stage.key)
            return (
              <div key={stage.key} className="flex flex-col">
                {/* Column Header */}
                <div className={`rounded-t-xl px-3 py-2.5 border-b-2 ${stage.color} font-bold text-sm flex items-center justify-between`}>
                  <span>{stage.label}</span>
                  <span className="text-[10px] font-mono bg-white/50 px-1.5 py-0.5 rounded">{stageApps.length}</span>
                </div>

                {/* Column Body */}
                <div className="flex-1 bg-muted/20 rounded-b-xl border border-t-0 p-2 space-y-2 min-h-[300px]">
                  {stageApps.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-8">
                      No applications
                    </div>
                  ) : (
                    stageApps.map(app => {
                      const nextStage = getNextStage(stage.key)
                      return (
                        <Card key={app.id} className="border shadow-sm bg-white hover:shadow-md transition-shadow cursor-grab">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                <GripVertical className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                <p className="text-sm font-bold leading-tight">{app.student_name || "Unnamed"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{app.class_applied || "Class N/A"}</span>
                            </div>
                            {app.parent_name && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                Guardian: {app.parent_name}
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{app.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}</span>
                            </div>
                            {nextStage && stage.key !== "declined" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full h-7 text-[10px] gap-1 mt-1 hover:bg-primary/5 text-primary"
                                onClick={() => moveToStage(app.id, nextStage.key)}
                                disabled={movingId === app.id}
                              >
                                {movingId === app.id ? "Moving..." : (
                                  <>Move to {nextStage.label} <ChevronRight className="w-3 h-3" /></>
                                )}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
