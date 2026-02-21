"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input, 
  Label, 
  Switch, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge
} from "@schoolerp/ui"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"

type PtmEventRow = {
  id: string
  title: string
  event_date: string
  teacher_name: string
}

type MessagingEventRow = {
  id: string
  event_type: string
  status: string
  retry_count: number
  created_at: string
}

type ModerationSettings = {
  quiet_hours_start: string
  quiet_hours_end: string
  blocked_keywords: string[]
  is_enabled: boolean
}

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const timeValue = (value: unknown) => {
  if (typeof value === "string") return value.slice(0, 5)
  if (value && typeof value === "object" && "Microseconds" in value) {
    const micros = Number((value as { Microseconds?: number }).Microseconds || 0)
    const totalSeconds = Math.floor(micros / 1e6)
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
    return `${hours}:${mins}`
  }
  return ""
}

const dateValue = (value: unknown) => {
  if (typeof value === "string") return value.slice(0, 10)
  if (value && typeof value === "object" && "Time" in value) {
    const t = (value as { Time?: string }).Time
    return typeof t === "string" ? t.slice(0, 10) : ""
  }
  return ""
}

export default function AdminCommunicationPage() {
  const [events, setEvents] = useState<MessagingEventRow[]>([])
  const [ptmEvents, setPtmEvents] = useState<PtmEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingModeration, setSavingModeration] = useState(false)
  const [savingPtmSettings, setSavingPtmSettings] = useState(false)

  const [ptmSettings, setPtmSettings] = useState({
    automated_reminders_enabled: false,
  })

  const [eventTypeFilter, setEventTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const [moderation, setModeration] = useState<ModerationSettings>({
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    blocked_keywords: [],
    is_enabled: false,
  })
  const [blockedKeywordsInput, setBlockedKeywordsInput] = useState("")

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    
    try {
      await Promise.all([fetchEvents(), fetchPTMEvents(), fetchModerationSettings(), fetchPTMSettings()])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchEvents = async () => {
    const params = new URLSearchParams({ limit: "50" })
    if (eventTypeFilter.trim()) params.set("event_type", eventTypeFilter.trim())
    if (statusFilter.trim()) params.set("status", statusFilter.trim())

    const res = await apiClient(`/admin/communication/events?${params.toString()}`)
    if (!res.ok) {
      throw new Error((await res.text()) || "Failed to load messaging events")
    }
    const data = await res.json()
    const rows: MessagingEventRow[] = Array.isArray(data)
      ? data.map((item: any) => ({
          id: textValue(item?.id),
          event_type: item?.event_type || "",
          status: textValue(item?.status),
          retry_count: Number(item?.retry_count?.Int32 || item?.retry_count || 0),
          created_at: dateValue(item?.created_at),
        }))
      : []
    setEvents(rows)
  }

  const fetchPTMEvents = async () => {
    const res = await apiClient("/admin/communication/ptm/events")
    if (!res.ok) {
      throw new Error((await res.text()) || "Failed to load PTM events")
    }
    const data = await res.json()
    const rows: PtmEventRow[] = Array.isArray(data)
      ? data.map((item: any) => ({
          id: textValue(item?.id),
          title: item?.title || "",
          event_date: dateValue(item?.event_date),
          teacher_name: item?.teacher_name || "",
        }))
      : []
    setPtmEvents(rows)
  }

  const fetchModerationSettings = async () => {
    const res = await apiClient("/admin/communication/chats/moderation")
    if (!res.ok) {
      throw new Error((await res.text()) || "Failed to load moderation settings")
    }

    const data = await res.json()
    const blockedKeywords: string[] = Array.isArray(data?.blocked_keywords) ? data.blocked_keywords : []

    setModeration({
      quiet_hours_start: timeValue(data?.quiet_hours_start) || "22:00",
      quiet_hours_end: timeValue(data?.quiet_hours_end) || "07:00",
      blocked_keywords: blockedKeywords,
      is_enabled: Boolean(data?.is_enabled?.Bool ?? data?.is_enabled),
    })
    setBlockedKeywordsInput(blockedKeywords.join(", "))
  }

  const fetchPTMSettings = async () => {
    try {
      const res = await apiClient("/admin/communication/ptm/settings")
      if (res.ok) {
        const data = await res.json()
        setPtmSettings(data)
      }
    } catch (err) {
      console.error("Failed to fetch PTM settings", err)
    }
  }

  const savePTMSettings = async (enabled: boolean) => {
    setSavingPtmSettings(true)
    try {
      const res = await apiClient("/admin/communication/ptm/settings", {
        method: "PUT",
        body: JSON.stringify({ automated_reminders_enabled: enabled }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("PTM settings updated")
      setPtmSettings({ automated_reminders_enabled: enabled })
    } catch (err) {
      toast.error("Failed to update PTM settings")
    } finally {
      setSavingPtmSettings(false)
    }
  }

  const saveModerationSettings = async () => {
    setSavingModeration(true)
    try {
      const blocked = blockedKeywordsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)

      const res = await apiClient("/admin/communication/chats/moderation", {
        method: "PUT",
        body: JSON.stringify({
          quiet_hours_start: moderation.quiet_hours_start,
          quiet_hours_end: moderation.quiet_hours_end,
          blocked_keywords: blocked,
          is_enabled: moderation.is_enabled,
        }),
      })
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to save moderation settings")
      }

      toast.success("Moderation settings updated")
      await fetchModerationSettings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save moderation settings")
    } finally {
      setSavingModeration(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Communication Center</h1>
          <p className="text-sm font-medium text-muted-foreground">Messaging events, PTM events, and chat moderation settings.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={refreshing} className="gap-2 shrink-0">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border border-border">
          <TabsTrigger value="events">Messaging Events</TabsTrigger>
          <TabsTrigger value="ptm">PTM Events</TabsTrigger>
          <TabsTrigger value="moderation">Chat Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6 mt-0">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Event Filters</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Input placeholder="e.g. attendance.absent" value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input placeholder="pending, completed, failed" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchEvents} className="w-full">Apply Filters</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Outbox Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-b-lg border-x border-b border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading events...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No events found.</TableCell>
                      </TableRow>
                    ) : (
                      events.map((event, index) => (
                        <TableRow key={`${event.id}-${index}`} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-foreground">{event.event_type || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={event.status === "completed" ? "default" : event.status === "failed" ? "destructive" : "secondary"} className="capitalize">
                              {event.status || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{event.retry_count}</TableCell>
                          <TableCell className="text-muted-foreground">{event.created_at || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ptm" className="mt-0">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">PTM Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-b-lg border-x border-b border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Title</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading PTM events...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : ptmEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">No PTM events found.</TableCell>
                      </TableRow>
                    ) : (
                      ptmEvents.map((event) => (
                        <TableRow key={event.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-foreground">{event.title || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{event.event_date || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{event.teacher_name || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="mt-0">
          <Card className="border-none shadow-sm max-w-2xl">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Chat Moderation Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Enable moderation controls</Label>
                  <p className="text-sm text-muted-foreground">Apply quiet hours and blocked keywords to chat.</p>
                </div>
                <Switch checked={moderation.is_enabled} onCheckedChange={(value) => setModeration((prev) => ({ ...prev, is_enabled: value }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quiet Hours Start</Label>
                  <Input type="time" value={moderation.quiet_hours_start} onChange={(e) => setModeration((prev) => ({ ...prev, quiet_hours_start: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Quiet Hours End</Label>
                  <Input type="time" value={moderation.quiet_hours_end} onChange={(e) => setModeration((prev) => ({ ...prev, quiet_hours_end: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Blocked Keywords (comma-separated)</Label>
                <Input value={blockedKeywordsInput} onChange={(e) => setBlockedKeywordsInput(e.target.value)} placeholder="abuse, spam, forbidden word" />
              </div>

              <div className="pt-4 border-t border-border">
                <Button onClick={saveModerationSettings} disabled={savingModeration} className="w-full sm:w-auto gap-2">
                  {savingModeration && <Loader2 className="h-4 w-4 animate-spin" />}
                  {savingModeration ? "Saving..." : "Save Moderation Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
