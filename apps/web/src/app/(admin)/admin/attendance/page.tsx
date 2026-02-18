"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button,
  Input,
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@schoolerp/ui"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Download,
  Check,
  X,
  Loader2
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import Link from "next/link"

interface AttendanceStats {
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
}

interface LeaveRow {
  id: unknown
  full_name: string
  admission_number: string
  from_date: unknown
  to_date: unknown
  reason: unknown
  status: unknown
  created_at: unknown
}

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const bytes = (value as { Bytes?: unknown }).Bytes
    if (typeof bytes === "string") return bytes
  }
  return ""
}

const dateLabel = (value: unknown) => {
  if (typeof value === "string") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? "-" : format(d, "MMM d, yyyy")
  }
  if (value && typeof value === "object" && "Time" in value) {
    const t = (value as { Time?: string }).Time
    if (!t) return "-"
    const d = new Date(t)
    return Number.isNaN(d.getTime()) ? "-" : format(d, "MMM d, yyyy")
  }
  return "-"
}

export default function AttendancePage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actioningId, setActioningId] = useState("")
  const [error, setError] = useState("")
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    fetchData(false)
  }, [date])

  const fetchData = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const [statsRes, leavesRes] = await Promise.all([
        apiClient(`/admin/attendance/stats?date=${dateStr}`),
        apiClient(`/admin/leaves?status=pending`),
      ])

      if (!statsRes.ok) {
        const msg = await statsRes.text()
        throw new Error(msg || "Failed to load attendance stats")
      }

      const statsData = await statsRes.json()
      setStats(statsData)

      if (leavesRes.ok) {
        const leavesData = await leavesRes.json()
        setLeaves(Array.isArray(leavesData) ? leavesData : [])
      } else {
        setLeaves([])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load attendance data"
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const processLeave = async (leaveID: string, action: "approve" | "reject") => {
    if (!leaveID) return
    setActioningId(leaveID)
    try {
      const res = await apiClient(`/admin/leaves/${leaveID}/${action}`, { method: "POST" })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Failed to ${action} leave`)
      }
      await fetchData(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${action} leave`
      setError(message)
    } finally {
      setActioningId("")
    }
  }

  const exportSummary = () => {
    const rows = [
      ["Date", format(date, "yyyy-MM-dd")],
      ["Total Students", String(stats?.total_students ?? 0)],
      ["Present", String(stats?.present_count ?? 0)],
      ["Absent", String(stats?.absent_count ?? 0)],
      ["Late", String(stats?.late_count ?? 0)],
      ["Excused", String(stats?.excused_count ?? 0)],
      ["Pending Leave Requests", String(leaves.length)],
    ]

    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `attendance-summary-${format(date, "yyyy-MM-dd")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const statCards = [
    {
      title: "Total Students",
      value: stats?.total_students || 0,
      icon: Users,
      className: "text-blue-600 bg-blue-50"
    },
    {
      title: "Present",
      value: stats?.present_count || 0,
      icon: UserCheck,
      className: "text-green-600 bg-green-50"
    },
    {
      title: "Absent",
      value: stats?.absent_count || 0,
      icon: UserX,
      className: "text-red-600 bg-red-50"
    },
    {
      title: "Late / Excused",
      value: (stats?.late_count || 0) + (stats?.excused_count || 0),
      icon: Clock,
      className: "text-amber-600 bg-amber-50"
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Overview</h1>
          <p className="text-muted-foreground">
            Daily attendance statistics for {format(date, "MMMM d, yyyy")}.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={exportSummary} className="gap-2">
              <Download className="h-4 w-4" />
              Export Summary
            </Button>
            <Link href="/admin/attendance/settings">
              <Button>Policy Settings</Button>
            </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={format(date, "yyyy-MM-dd")}
          onChange={(e) => setDate(new Date(`${e.target.value}T00:00:00`))}
          className="w-auto"
        />
        <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold">{loading ? "-" : stat.value}</h3>
              </div>
              <div className={`p-3 rounded-full ${stat.className}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Attendance Rate</p>
                        <p className="text-xl font-semibold">
                          {stats?.total_students ? Math.round(((stats.present_count || 0) / stats.total_students) * 100) : 0}%
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Absence Rate</p>
                        <p className="text-xl font-semibold">
                          {stats?.total_students ? Math.round(((stats.absent_count || 0) / stats.total_students) * 100) : 0}%
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Pending Leaves</p>
                        <p className="text-xl font-semibold">{leaves.length}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Selected Date</p>
                        <p className="text-xl font-semibold">{format(date, "MMM d")}</p>
                      </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading leave requests...
                </div>
              ) : leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <AlertCircle className="mb-2 h-8 w-8 opacity-40" />
                  No pending leave requests.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2">Admission #</th>
                        <th className="px-3 py-2">From</th>
                        <th className="px-3 py-2">To</th>
                        <th className="px-3 py-2">Reason</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => {
                        const leaveID = uuidValue(leave.id)
                        const reason = textValue(leave.reason)
                        return (
                          <tr key={leaveID || `${leave.full_name}-${dateLabel(leave.created_at)}`} className="border-t">
                            <td className="px-3 py-2 text-sm font-medium">{leave.full_name || "-"}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">{leave.admission_number || "-"}</td>
                            <td className="px-3 py-2 text-sm">{dateLabel(leave.from_date)}</td>
                            <td className="px-3 py-2 text-sm">{dateLabel(leave.to_date)}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">{reason || "-"}</td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  disabled={!leaveID || actioningId === leaveID}
                                  onClick={() => processLeave(leaveID, "approve")}
                                >
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-rose-600 hover:text-rose-700"
                                  disabled={!leaveID || actioningId === leaveID}
                                  onClick={() => processLeave(leaveID, "reject")}
                                >
                                  <X className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Export a CSV summary for the selected date. Includes totals, rates, and pending leaves.
                    </p>
                    <Button variant="outline" className="gap-2" onClick={exportSummary}>
                      <Download className="h-4 w-4" /> Download CSV
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
