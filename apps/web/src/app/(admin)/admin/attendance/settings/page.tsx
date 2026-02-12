"use client"

import { useEffect, useState } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@schoolerp/ui"
import { Switch } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function AdminAttendanceSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [editWindow, setEditWindow] = useState("24")
  const [requireReason, setRequireReason] = useState(true)
  const [lockPreviousMonths, setLockPreviousMonths] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setInitializing(true)
    try {
      const res = await apiClient("/admin/attendance/policies")
      if (!res.ok) {
        return
      }
      const policies = await res.json()
      const settingsPolicy = Array.isArray(policies)
        ? policies.find((p) => p.module === "attendance" && p.action === "settings")
        : null

      const logic = settingsPolicy?.logic || {}
      if (typeof logic.edit_window_hours === "number") {
        setEditWindow(String(logic.edit_window_hours))
      }
      if (typeof logic.require_reason_for_edits === "boolean") {
        setRequireReason(logic.require_reason_for_edits)
      }
      if (typeof logic.lock_previous_months === "boolean") {
        setLockPreviousMonths(logic.lock_previous_months)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInitializing(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/attendance/policies", {
        method: "POST",
        body: JSON.stringify({
          module: "attendance",
          action: "settings",
          logic: {
            edit_window_hours: parseInt(editWindow) || 24,
            require_reason_for_edits: requireReason,
            lock_previous_months: lockPreviousMonths,
          },
          is_active: true,
        })
      })
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to save attendance settings")
      }
      toast.success("Attendance settings saved")
    } catch (err) {
      console.error(err)
      toast.error("Failed to save attendance settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Attendance Settings</h1>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Marking Window</CardTitle>
            <CardDescription>
              Configure how far back teachers can mark or edit attendance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Edit Window (In Hours)</Label>
              <Input
                type="number"
                value={editWindow}
                onChange={(e) => setEditWindow(e.target.value)}
                disabled={initializing}
              />
              <p className="text-xs text-gray-500">
                Number of hours after marking that a teacher can edit attendance without approval.
              </p>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label className="flex flex-col space-y-1">
                <span>Require Reason for Edits</span>
                <span className="font-normal text-xs text-gray-500">
                  Always ask for a reason when attendance is changed.
                </span>
              </Label>
              <Switch checked={requireReason} onCheckedChange={setRequireReason} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Locks</CardTitle>
            <CardDescription>
              Block attendance marking for specific periods.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label className="flex flex-col space-y-1">
                <span>Lock Previous Months</span>
                <span className="font-normal text-xs text-gray-500">
                  Automatically lock attendance marking for the previous month on the 5th of current month.
                </span>
              </Label>
              <Switch checked={lockPreviousMonths} onCheckedChange={setLockPreviousMonths} />
            </div>
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
              Lock All Attendance (Emergency)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
