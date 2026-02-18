"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@schoolerp/ui"
import { toast } from "sonner"

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
  const [savingModeration, setSavingModeration] = useState(false)

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

  const fetchAll = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchEvents(), fetchPTMEvents(), fetchModerationSettings()])
    } finally {
      setLoading(false)
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication Center</h1>
          <p className="text-sm text-muted-foreground">Messaging events, PTM events, and chat moderation settings.</p>
        </div>
        <Button variant="outline" onClick={fetchAll}>Refresh</Button>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Messaging Events</TabsTrigger>
          <TabsTrigger value="ptm">PTM Events</TabsTrigger>
          <TabsTrigger value="moderation">Chat Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="event type (e.g. attendance.absent)" value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} />
              <Input placeholder="status (pending/completed/failed)" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
              <Button onClick={fetchEvents}>Apply Filters</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outbox Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Retries</th>
                        <th className="px-3 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event, index) => (
                        <tr key={`${event.id}-${index}`} className="border-t">
                          <td className="px-3 py-2 text-sm">{event.event_type || "-"}</td>
                          <td className="px-3 py-2 text-sm">{event.status || "-"}</td>
                          <td className="px-3 py-2 text-sm">{event.retry_count}</td>
                          <td className="px-3 py-2 text-sm">{event.created_at || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ptm">
          <Card>
            <CardHeader>
              <CardTitle>PTM Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading PTM events...</p>
              ) : ptmEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No PTM events found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Event Date</th>
                        <th className="px-3 py-2">Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ptmEvents.map((event) => (
                        <tr key={event.id} className="border-t">
                          <td className="px-3 py-2 text-sm">{event.title || "-"}</td>
                          <td className="px-3 py-2 text-sm">{event.event_date || "-"}</td>
                          <td className="px-3 py-2 text-sm">{event.teacher_name || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Chat Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable moderation controls</Label>
                <Switch checked={moderation.is_enabled} onCheckedChange={(value) => setModeration((prev) => ({ ...prev, is_enabled: value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              <Button onClick={saveModerationSettings} disabled={savingModeration}>
                {savingModeration ? "Saving..." : "Save Moderation Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
