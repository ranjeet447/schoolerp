"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  CalendarCheck, 
  BookOpen, 
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';

interface AttendanceStats {
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
}

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [noticesCount, setNoticesCount] = useState(0)
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0)

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const dateStr = new Date().toISOString().split("T")[0]
      const [attendanceRes, noticesRes, leavesRes] = await Promise.all([
        apiClient(`/teacher/attendance/stats?date=${dateStr}`),
        apiClient("/teacher/notices"),
        apiClient("/teacher/leaves?status=pending"),
      ])

      if (attendanceRes.ok) {
        const attendancePayload = await attendanceRes.json()
        setAttendanceStats(attendancePayload || null)
      } else {
        setAttendanceStats(null)
      }

      if (noticesRes.ok) {
        const noticesPayload = await noticesRes.json()
        const notices = Array.isArray(noticesPayload) ? noticesPayload : noticesPayload?.data || []
        setNoticesCount(notices.length)
      } else {
        setNoticesCount(0)
      }

      if (leavesRes.ok) {
        const leavesPayload = await leavesRes.json()
        const leaves = Array.isArray(leavesPayload) ? leavesPayload : leavesPayload?.data || []
        setPendingLeavesCount(leaves.length)
      } else {
        setPendingLeavesCount(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teacher dashboard")
      setAttendanceStats(null)
      setNoticesCount(0)
      setPendingLeavesCount(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard(false)
  }, [])

  const attendanceRatio = useMemo(() => {
    if (!attendanceStats?.total_students) return 0
    return Math.round(((attendanceStats.present_count || 0) / attendanceStats.total_students) * 100)
  }, [attendanceStats])

  const stats = [
    { label: 'My Students', value: String(attendanceStats?.total_students || 0), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pending Leaves', value: String(pendingLeavesCount), icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Attendance Ratio', value: `${attendanceRatio}%`, icon: CalendarCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Notices', value: String(noticesCount), icon: MessageSquare, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Academic Overview</h1>
          <p className="text-slate-500">Daily teaching operations snapshot for attendance, notices, and pending leaves.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-3 w-3" /> Live Overview
          </div>
          <Button variant="outline" onClick={() => loadDashboard(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
      {loading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading dashboard...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-emerald-100 rounded-3xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-emerald-50 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 font-bold text-lg">Today's Schedule</CardTitle>
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-widest">View Full Calendar</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-emerald-50">
              {[
                { subject: 'Mathematics', class: 'Grade 10-A', time: '09:00 - 09:45', status: 'completed' },
                { subject: 'Science', class: 'Grade 10-C', time: '10:00 - 10:45', status: 'current' },
                { subject: 'Physics', class: 'Grade 12-B', time: '11:15 - 12:00', status: 'pending' },
                { subject: 'Mathematics', class: 'Grade 11-A', time: '13:00 - 13:45', status: 'pending' },
              ].map((item, i) => (
                <div key={i} className={`p-5 flex items-center gap-4 transition-colors ${item.status === 'current' ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                  <div className={`h-2 w-2 rounded-full ${item.status === 'completed' ? 'bg-slate-300' : item.status === 'current' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-200'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.subject}</p>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{item.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">{item.time}</p>
                    {item.status === 'current' && <span className="text-[10px] text-emerald-600 font-black uppercase">Ongoing</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Tasks</h3>
            <div className="space-y-3">
              {[
                'Submit Grade 10-A marks report',
                'Approve leaf requests (3)',
                'Class teacher meeting @ 4PM',
                'Upload homework for Science'
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group cursor-pointer hover:bg-emerald-50 transition-colors">
                  <div className="h-5 w-5 rounded border border-slate-300 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                    <CheckCircle2 className="h-3 w-3 text-transparent group-hover:text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
