"use client"

import { useState, useEffect } from "react"
import { NoticeCard, TargetSelector, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Users, CheckCircle2, Clock } from "lucide-react"

type ScopeTarget = { value: string; label: string }

const DEFAULT_SCOPES: ScopeTarget[] = [{ value: "all", label: "All School" }]

const asArray = <T,>(input: any, candidates: string[] = []): T[] => {
  if (Array.isArray(input)) return input as T[]
  for (const key of candidates) {
    if (Array.isArray(input?.[key])) return input[key] as T[]
  }
  return []
}

const normalizeNotice = (raw: any) => ({
  ...raw,
  attachments: Array.isArray(raw?.attachments)
    ? raw.attachments
    : typeof raw?.attachments === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(raw.attachments)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        })()
      : [],
})

const normalizeToken = (input: string) =>
  String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const classScopeValue = (className: string) => {
  const text = String(className || "").toLowerCase()
  const digits = text.match(/\d+/)?.[0]
  if (digits) return `class_${digits}`
  const normalized = normalizeToken(className)
  return normalized ? `class_${normalized}` : ""
}

const sectionScopeValue = (sectionName: string) => {
  const normalized = normalizeToken(sectionName)
  return normalized ? `section_${normalized}` : ""
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [scope, setScope] = useState("")
  const [publishAt, setPublishAt] = useState("")
  const [attachments, setAttachments] = useState<any[]>([])
  const [scopeTargets, setScopeTargets] = useState<ScopeTarget[]>(DEFAULT_SCOPES)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Acks Drawer State
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null)
  const [ackStats, setAckStats] = useState<any>(null)
  const [acks, setAcks] = useState<any[]>([])
  const [loadingAcks, setLoadingAcks] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData
      })
      if (!res.ok) throw new Error("Upload failed")
      const result = await res.json()
      setAttachments(prev => [...prev, { id: result.id, name: result.name, url: result.url }])
      toast.success(`Uploaded: ${result.name}`)
    } catch (err) {
      toast.error("Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  const openAcksDrawer = async (notice: any) => {
    setSelectedNotice(notice)
    setLoadingAcks(true)
    try {
      const [statsRes, listRes] = await Promise.all([
        apiClient(`/admin/notices/${notice.id}/acks/stats`),
        apiClient(`/admin/notices/${notice.id}/acks`)
      ])
      
      if (statsRes.ok) {
        const statsPayload = await statsRes.json()
        setAckStats(statsPayload?.stats || statsPayload || null)
      }
      if (listRes.ok) {
        const listPayload = await listRes.json()
        setAcks(asArray<any>(listPayload, ["acks", "rows", "items", "data"]))
      }
    } catch (err) {
      toast.error("Failed to load notice acknowledgements")
    } finally {
      setLoadingAcks(false)
    }
  }

  useEffect(() => {
    fetchNotices()
    fetchScopeTargets()
  }, [])

  const fetchScopeTargets = async () => {
    try {
      const classRes = await apiClient("/admin/academic-structure/classes")
      if (!classRes.ok) {
        setScopeTargets(DEFAULT_SCOPES)
        return
      }

      const classes = await classRes.json()
      const classRows = asArray<any>(classes, ["classes", "rows", "items", "data"])

      const targets: ScopeTarget[] = [...DEFAULT_SCOPES]
      const seen = new Set<string>(targets.map((item) => item.value))

      for (const classRow of classRows) {
        const className = String(classRow?.name || "")
        const classValue = classScopeValue(className)
        if (classValue && !seen.has(classValue)) {
          seen.add(classValue)
          targets.push({ value: classValue, label: className })
        }

        const classID = String(classRow?.id || "")
        if (!classID) continue

        const sectionRes = await apiClient(`/admin/academic-structure/classes/${classID}/sections`)
        if (!sectionRes.ok) continue

        const sections = await sectionRes.json()
        const sectionRows = asArray<any>(sections, ["sections", "rows", "items", "data"])
        for (const sectionRow of sectionRows) {
          const sectionName = String(sectionRow?.name || "")
          const sectionValue = sectionScopeValue(sectionName)
          if (sectionValue && !seen.has(sectionValue)) {
            seen.add(sectionValue)
            targets.push({ value: sectionValue, label: `Section ${sectionName}` })
          }
        }
      }

      setScopeTargets(targets)
    } catch {
      setScopeTargets(DEFAULT_SCOPES)
    }
  }

  const fetchNotices = async () => {
    try {
      const res = await apiClient("/admin/notices")
      if (res.ok) {
        const data = await res.json()
        const rows = asArray<any>(data, ["notices", "rows", "items", "data"]).map(normalizeNotice)
        setNotices(rows)
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
        body: JSON.stringify({ 
          title, 
          body, 
          scope, 
          attachments,
          publish_at: publishAt ? new Date(publishAt).toISOString() : null
        })
      })
      if (res.ok) {
        toast.success("Notice published successfully")
        fetchNotices()
        setTitle("")
        setBody("")
        setScope("")
        setAttachments([])
        setPublishAt("")
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
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b pb-4 mb-4">
              <CardTitle className="text-lg">Create New Notice</CardTitle>
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
                    targets={scopeTargets} 
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
                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="space-y-2">
                    <Input 
                      type="file" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((at, i) => (
                          <Badge key={i} variant="secondary" className="pr-1 gap-1">
                            {at.name}
                            <button type="button" onClick={() => removeAttachment(i)} className="hover:text-red-500">×</button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Schedule Publishing (Optional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400">Leave blank to publish immediately</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Publishing..." : "Publish Notice"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Recent Notices</h2>
          {notices.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 border-2 border-dashed rounded-xl text-muted-foreground font-medium">
              No notices published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map(n => (
                <div key={n.id} className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => openAcksDrawer(n)}>
                  <NoticeCard {...n} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <div className="mx-auto w-full p-6">
            <DialogHeader className="px-0">
              <DialogTitle className="text-2xl">{selectedNotice?.title}</DialogTitle>
              <DialogDescription>View parent acknowledgements and audience reach</DialogDescription>
            </DialogHeader>

            {loadingAcks ? (
              <div className="py-12 text-center text-muted-foreground">Loading statistics...</div>
            ) : (
              <div className="space-y-6">
                {ackStats && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/30 dark:text-blue-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Total Audience</p>
                          <p className="text-2xl font-bold">{ackStats.total_audience}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Acknowledged</p>
                          <p className="text-2xl font-bold">{ackStats.acknowledged_count}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl dark:bg-orange-900/30 dark:text-orange-400">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Pending</p>
                          <p className="text-2xl font-bold">{ackStats.pending_count}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="rounded-xl border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parent Name</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acknowledged At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No audience found for this notice.
                          </TableCell>
                        </TableRow>
                      ) : (
                        acks.map((ack) => (
                          <TableRow key={ack.guardian_id}>
                            <TableCell className="font-medium">{ack.guardian_name}</TableCell>
                            <TableCell>
                              {ack.student_name}
                              <span className="text-xs text-muted-foreground ml-2">({ack.admission_number})</span>
                            </TableCell>
                            <TableCell>
                              {ack.is_acknowledged ? (
                                <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">
                                  Acknowledged
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {ack.is_acknowledged && ack.ack_at ? new Date(ack.ack_at).toLocaleDateString() : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
