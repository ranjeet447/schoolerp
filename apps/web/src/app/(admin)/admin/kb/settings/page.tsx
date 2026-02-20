"use client"

import { useEffect, useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Switch,
} from "@schoolerp/ui"
import { Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

const ROLE_OPTIONS = ["tenant_admin", "teacher", "parent", "student", "accountant"]

interface Settings {
  enabled: boolean
  allowed_roles: string[]
  allow_parents: boolean
  allow_students: boolean
}

export default function KBSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchSettings = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient("/admin/kb/settings")
      if (!res.ok) throw new Error((await res.text()) || "Failed to load KB settings")
      setSettings(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KB settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const toggleRole = (role: string, checked: boolean | "indeterminate") => {
    if (!settings) return
    const isChecked = checked === true
    const next = new Set(settings.allowed_roles || [])
    if (isChecked) next.add(role)
    else next.delete(role)
    setSettings({ ...settings, allowed_roles: Array.from(next) })
  }

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setError("")
    try {
      const res = await apiClient("/admin/kb/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to save settings")
      setSettings(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">{error || "Unable to load KB settings"}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledgebase Settings</h1>
        <p className="text-muted-foreground">Control who can use search and whether parent/student access is allowed.</p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Access Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Knowledgebase</p>
              <p className="text-sm text-muted-foreground">Turns tenant knowledgebase search on or off.</p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
          </div>

          <div className="space-y-3">
            <p className="font-medium">Allowed roles</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={(settings.allowed_roles || []).includes(role)} onCheckedChange={(v) => toggleRole(role, v)} />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Allow Parents</Label>
                <p className="text-xs text-muted-foreground">Parents can search parent-visible KB docs.</p>
              </div>
              <Switch checked={settings.allow_parents} onCheckedChange={(v) => setSettings({ ...settings, allow_parents: v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Allow Students</Label>
                <p className="text-xs text-muted-foreground">Students can search student-visible KB docs.</p>
              </div>
              <Switch checked={settings.allow_students} onCheckedChange={(v) => setSettings({ ...settings, allow_students: v })} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
