"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AdminAttendanceSettingsPage() {
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      alert("Settings saved!")
      setLoading(false)
    }, 1000)
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
              <Input type="number" defaultValue="24" />
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
              <Switch defaultChecked />
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
              <Switch defaultChecked />
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
