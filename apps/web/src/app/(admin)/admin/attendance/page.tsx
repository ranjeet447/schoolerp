"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button,
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@schoolerp/ui"
import { 
  CalendarCheck, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertCircle 
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"

interface AttendanceStats {
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
}

export default function AttendancePage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    fetchStats()
  }, [date])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const res = await apiClient(`/admin/attendance/stats?date=${dateStr}`)
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
            <Button variant="outline">Download Report</Button>
            <Button>Mark Attendance</Button>
        </div>
      </div>

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
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                        <AlertCircle className="w-12 h-12 opacity-20" />
                        <p>No recent activity logs found for today.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="reports">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Reports</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground">
                    Report generation module is coming soon.
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
