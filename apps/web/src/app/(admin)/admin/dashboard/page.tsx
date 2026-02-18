"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Banknote, 
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface AttendanceStats {
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
}

interface StudentRow {
  id: string
  full_name: string
  admission_number: string
}

interface AdmissionApplication {
  id: string
  application_number: string
  student_name?: string
  parent_name?: string
  status: string
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [applications, setApplications] = useState<AdmissionApplication[]>([])

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const [attendanceRes, studentsRes, applicationsRes] = await Promise.all([
        apiClient('/admin/attendance/stats'),
        apiClient('/admin/students?limit=10'),
        apiClient('/admin/admissions/applications?limit=10'),
      ])

      if (!attendanceRes.ok) {
        const msg = await attendanceRes.text()
        throw new Error(msg || 'Failed to load dashboard attendance data')
      }
      if (!studentsRes.ok) {
        const msg = await studentsRes.text()
        throw new Error(msg || 'Failed to load students data')
      }
      if (!applicationsRes.ok) {
        const msg = await applicationsRes.text()
        throw new Error(msg || 'Failed to load admissions data')
      }

      const attendanceData = await attendanceRes.json()
      const studentsData = await studentsRes.json()
      const applicationsData = await applicationsRes.json()

      setAttendance(attendanceData)
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData?.data || [])
      setApplications(Array.isArray(applicationsData) ? applicationsData : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard(false)
  }, [])

  const presentRate = useMemo(() => {
    if (!attendance?.total_students) return 0
    return Math.round(((attendance.present_count || 0) / attendance.total_students) * 100)
  }, [attendance])

  const pendingApplications = useMemo(
    () => applications.filter((app) => (app.status || '').toLowerCase() === 'pending').length,
    [applications]
  )

  const statCards = [
    { label: 'Total Students', value: String(attendance?.total_students ?? students.length), icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Present Today', value: String(attendance?.present_count ?? 0), icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Absent Today', value: String(attendance?.absent_count ?? 0), icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Attendance Rate', value: `${presentRate}%`, icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Operational summary for attendance, students, and admissions.</p>
        </div>
        <Button variant="outline" onClick={() => loadDashboard(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading dashboard...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
              </div>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">Live from current tenant data</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-foreground font-black text-xl uppercase tracking-tight">Recent Admissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {applications.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No admission applications found.</div>
              ) : (
                applications.slice(0, 6).map((app) => (
                  <div key={app.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition-colors group">
                    <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.25)]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {(app.student_name || 'Unnamed Applicant')} • {(app.status || 'unknown').toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                        {app.application_number || app.id}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="bg-primary rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden">
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Students Snapshot</h3>
            <p className="text-primary-foreground/80 text-sm mb-4 leading-relaxed">
              Latest student records from this tenant.
            </p>
            <div className="space-y-2 text-xs">
              {students.slice(0, 4).map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded bg-white/10 px-2 py-1">
                  <span className="truncate">{student.full_name || 'Unknown'}</span>
                  <span className="font-mono">{student.admission_number || '-'}</span>
                </div>
              ))}
              {students.length === 0 && <div className="text-primary-foreground/80">No students found.</div>}
            </div>
          </div>

          <div className="bg-card border border-rose-500/20 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Action Required</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">{pendingApplications} admission applications are pending review.</p>
            <Link href="/admin/admissions/applications">
              <Button variant="ghost" className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 font-bold uppercase text-xs tracking-widest">Open Admissions Queue</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
