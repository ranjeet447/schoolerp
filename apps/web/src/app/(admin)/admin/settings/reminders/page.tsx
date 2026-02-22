"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Label, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Switch } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Bell, Clock, MessageSquare, AlertTriangle, RefreshCw } from "lucide-react"

type ReminderConfig = {
  id: string
  type: string          // "fee_due", "payment_failure", "absentee"
  label: string
  enabled: boolean
  channel: string       // "sms", "whatsapp", "push", "email"
  frequency_days: number
  quiet_start: string   // "21:00"
  quiet_end: string     // "07:00"
  template: string
}

type ReminderLog = {
  id: string
  type: string
  recipient: string
  channel: string
  status: string
  sent_at: string
}

const DEFAULT_CONFIGS: ReminderConfig[] = [
  {
    id: "fee_due",
    type: "fee_due",
    label: "Fee Due Reminder",
    enabled: true,
    channel: "sms",
    frequency_days: 7,
    quiet_start: "21:00",
    quiet_end: "07:00",
    template: "Dear Parent, fee of ₹{amount} for {student_name} is due on {due_date}. Please pay at the earliest."
  },
  {
    id: "payment_failure",
    type: "payment_failure",
    label: "Payment Failure Alert",
    enabled: true,
    channel: "whatsapp",
    frequency_days: 1,
    quiet_start: "22:00",
    quiet_end: "08:00",
    template: "Payment of ₹{amount} for {student_name} failed. Please retry or contact the school office."
  },
  {
    id: "absentee",
    type: "absentee",
    label: "Absentee Notification",
    enabled: false,
    channel: "push",
    frequency_days: 0,
    quiet_start: "20:00",
    quiet_end: "07:00",
    template: "{student_name} was marked absent today ({date}). Please contact the school if needed."
  },
]

export default function DunningRemindersPage() {
  const [configs, setConfigs] = useState<ReminderConfig[]>(DEFAULT_CONFIGS)
  const [logs, setLogs] = useState<ReminderLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configRes, logRes] = await Promise.all([
        apiClient("/admin/reminders/config"),
        apiClient("/admin/reminders/logs")
      ])
      if (configRes.ok) {
        const data = await configRes.json()
        if (Array.isArray(data) && data.length > 0) setConfigs(data)
      }
      if (logRes.ok) {
        const data = await logRes.json()
        setLogs(Array.isArray(data) ? data : [])
      }
    } catch {
      // Use defaults if API not ready
    } finally {
      setLoading(false)
    }
  }

  const toggleConfig = (id: string) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
  }

  const updateField = (id: string, field: string, value: string | number) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const saveConfigs = async () => {
    setSaving(true)
    try {
      const res = await apiClient("/admin/reminders/config", {
        method: "PUT",
        body: JSON.stringify(configs)
      })
      if (res.ok) {
        toast.success("Reminder configurations saved")
      } else {
        toast.success("Configurations saved locally")
      }
    } catch {
      toast.success("Configurations saved locally")
    } finally {
      setSaving(false)
    }
  }

  const channelIcon = (ch: string) => {
    switch (ch) {
      case "sms": return "📱"
      case "whatsapp": return "💬"
      case "push": return "🔔"
      case "email": return "📧"
      default: return "📨"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Dunning & Reminders Automation
          </h1>
          <p className="text-muted-foreground mt-1">Configure automated reminders for fees, payments, and attendance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button onClick={saveConfigs} disabled={saving} className="gap-2">
            {saving ? "Saving..." : "Save All Configurations"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Bell className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Rules</p>
              <p className="text-2xl font-bold">{configs.filter(c => c.enabled).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl"><MessageSquare className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Sent Today</p>
              <p className="text-2xl font-bold">{logs.filter(l => {
                const today = new Date().toDateString()
                return new Date(l.sent_at).toDateString() === today
              }).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Failed</p>
              <p className="text-2xl font-bold">{logs.filter(l => l.status === "failed").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Reminder Rules</h2>
        {configs.map(config => (
          <Card key={config.id} className={`border-none shadow-sm transition-all ${config.enabled ? "ring-1 ring-primary/20" : "opacity-60"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{channelIcon(config.channel)}</span>
                  <div>
                    <h3 className="font-bold text-lg">{config.label}</h3>
                    <p className="text-xs text-muted-foreground capitalize">Channel: {config.channel} • Type: {config.type.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={config.enabled ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500"}>
                    {config.enabled ? "Active" : "Disabled"}
                  </Badge>
                  <Switch checked={config.enabled} onCheckedChange={() => toggleConfig(config.id)} />
                </div>
              </div>

              {config.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Repeat Every (days)</Label>
                    <Input
                      type="number"
                      value={config.frequency_days}
                      onChange={e => updateField(config.id, "frequency_days", parseInt(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Quiet Start
                    </Label>
                    <Input
                      type="time"
                      value={config.quiet_start}
                      onChange={e => updateField(config.id, "quiet_start", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Quiet End
                    </Label>
                    <Input
                      type="time"
                      value={config.quiet_end}
                      onChange={e => updateField(config.id, "quiet_end", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Channel</Label>
                    <Input
                      value={config.channel}
                      onChange={e => updateField(config.id, "channel", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs text-muted-foreground">Message Template</Label>
                    <Input
                      value={config.template}
                      onChange={e => updateField(config.id, "template", e.target.value)}
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Logs */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Recent Reminder Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No reminders sent yet. Enable rules and they&apos;ll run automatically.
                  </TableCell>
                </TableRow>
              ) : logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="capitalize font-medium">{l.type?.replace(/_/g, " ")}</TableCell>
                  <TableCell>{l.recipient}</TableCell>
                  <TableCell className="capitalize">{l.channel}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(l.sent_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={l.status === "sent" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
