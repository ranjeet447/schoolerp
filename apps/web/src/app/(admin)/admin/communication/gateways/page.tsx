"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { apiClient, asArrayPayload } from "@/lib/api-client"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Switch, Textarea } from "@schoolerp/ui"
import { toast } from "sonner"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"

type GatewayRow = {
  id: string
  provider: string
  api_key: string
  api_secret: string
  sender_id: string
  is_active: boolean
  settings: string
  updated_at?: string
}

const PROVIDERS = [
  { value: "msg91", label: "MSG91 (SMS / WhatsApp)" },
  { value: "smshorizon", label: "SMS Horizon (SMS)" },
  { value: "webhook", label: "Generic Webhook Adapter" },
  { value: "smtp", label: "SMTP (future/adapter dependent)" },
]

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: unknown }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const boolValue = (value: unknown) => {
  if (typeof value === "boolean") return value
  if (value && typeof value === "object" && "Bool" in value) {
    return Boolean((value as { Bool?: unknown }).Bool)
  }
  return false
}

const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    return JSON.stringify(value)
  }
  return ""
}

const parseSettings = (value: unknown) => {
  if (!value) return "{}"
  if (typeof value === "string") {
    try {
      // []byte is often base64-encoded by Go JSON; keep raw if not JSON.
      return value.startsWith("{") || value.startsWith("[") ? value : "{}"
    } catch {
      return "{}"
    }
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return "{}"
    }
  }
  return "{}"
}

export default function AdminCommunicationGatewaysPage() {
  const [rows, setRows] = useState<GatewayRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [provider, setProvider] = useState("msg91")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [senderId, setSenderId] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [settingsText, setSettingsText] = useState("{}")

  const fetchGateways = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient("/admin/notifications/gateways")
      if (!res.ok) throw new Error((await res.text()) || "Failed to load gateways")
      const data = await res.json()
      const next = asArrayPayload<any>(data).map((item) => ({
        id: uuidValue(item?.id),
        provider: item?.provider || "",
        api_key: textValue(item?.api_key),
        api_secret: textValue(item?.api_secret),
        sender_id: textValue(item?.sender_id),
        is_active: boolValue(item?.is_active),
        settings: parseSettings(item?.settings),
        updated_at: typeof item?.updated_at?.Time === "string" ? item.updated_at.Time : undefined,
      }))
      setRows(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load gateways")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchGateways()
  }, [])

  const loadIntoForm = (row: GatewayRow) => {
    setProvider(row.provider || "msg91")
    setSenderId(row.sender_id || "")
    setIsActive(row.is_active)
    setSettingsText(row.settings || "{}")
    // Keep secrets blank unless admin intentionally enters new values.
    setApiKey("")
    setApiSecret("")
  }

  const resetForm = () => {
    setProvider("msg91")
    setApiKey("")
    setApiSecret("")
    setSenderId("")
    setIsActive(false)
    setSettingsText("{}")
  }

  const saveGateway = async () => {
    setSaving(true)
    try {
      let parsedSettings: unknown = {}
      if (settingsText.trim()) {
        parsedSettings = JSON.parse(settingsText)
      }
      const res = await apiClient("/admin/notifications/gateways", {
        method: "POST",
        body: JSON.stringify({
          provider,
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          sender_id: senderId.trim(),
          is_active: isActive,
          settings: parsedSettings,
        }),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to save gateway")
      toast.success("Gateway configuration saved")
      await fetchGateways(true)
      setApiKey("")
      setApiSecret("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save gateway")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/communication" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Communication Center
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Notification Gateways</h1>
          <p className="text-sm text-muted-foreground">
            Configure SMS / WhatsApp / webhook delivery providers. Secrets are masked on read and only updated when re-entered.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => fetchGateways(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Configured Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading gateways...
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notification gateways configured yet.</p>
            ) : (
              rows.map((row) => (
                <div key={`${row.provider}-${row.id}`} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold capitalize">{row.provider}</div>
                        <Badge variant={row.is_active ? "default" : "secondary"}>
                          {row.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sender: {row.sender_id || "—"} · API Key: {row.api_key || "—"} · Secret: {row.api_secret || "—"}
                      </div>
                      {row.updated_at ? (
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(row.updated_at).toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => loadIntoForm(row)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create / Update Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-id">Sender ID (optional)</Label>
              <Input id="sender-id" value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="SCHOOLERP" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave blank to keep existing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Leave blank to keep existing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-json">Provider Settings (JSON)</Label>
              <Textarea
                id="settings-json"
                value={settingsText}
                onChange={(e) => setSettingsText(e.target.value)}
                rows={6}
                placeholder='{"route":"4","channel":"sms"}'
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium">Set as active gateway</div>
                <p className="text-xs text-muted-foreground">Only one active provider should be used for default notification sends.</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={saveGateway} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Gateway
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
