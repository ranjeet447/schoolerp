"use client"

import React, { useEffect, useState } from 'react';
import { 
  Users, GraduationCap, Banknote, AlertCircle, RefreshCw, Loader2, TrendingUp,
  Megaphone, Printer, CheckCircle, FileText, UserCheck, Activity, MessageSquare, 
  BookOpen, Truck, ShieldCheck, Database, LayoutGrid, Clock
} from 'lucide-react';
import { 
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress
} from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

type DefaulterSummary = {
  classLabel: string
  amount: number
  students: number
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Stats from backend
  const [stats, setStats] = useState({
    collectionToday: 0,
    absentees: 0,
    enquiries: 0,
    staffOnLeave: 0
  })

  const [approvals, setApprovals] = useState<any[]>([])
  const [defaulters, setDefaulters] = useState<DefaulterSummary[]>([])
  const [certificates, setCertificates] = useState<any[]>([])

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    
    try {
      const [statsRes, approvalsRes, certsRes, defaultersRes] = await Promise.all([
        apiClient("/admin/dashboard/command-status"),
        apiClient("/admin/approvals?status=pending&limit=3"),
        apiClient("/admin/certificates/list?status=pending&limit=5"),
        apiClient("/admin/payments/reports/defaulters/data")
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats({
          collectionToday: data.finance?.collected_today || 0,
          absentees: data.attendance?.students?.absent || 0,
          enquiries: data.admissions?.walkins_today || 0,
          staffOnLeave: data.attendance?.staff?.absent || 0
        })
      }

      if (approvalsRes.ok) {
        const data = await approvalsRes.json()
        setApprovals(data)
      }

      if (certsRes.ok) {
        const data = await certsRes.json()
        const rows = Array.isArray(data) ? data : (data?.certificates || [])
        setCertificates(rows.slice(0, 3))
      }

      if (defaultersRes.ok) {
        const data = await defaultersRes.json()
        const rows = Array.isArray(data) ? data : []
        const grouped = new Map<string, { amount: number; students: Set<string> }>()
        rows.forEach((row: any) => {
          const className = String(row?.class_name || "Class")
          const sectionName = String(row?.section_name || "")
          const label = sectionName ? `${className}-${sectionName}` : className
          const amount = Number(row?.balance_amount || 0)
          const studentId = String(row?.student_id?.String || row?.student_id || row?.full_name || "")
          const current = grouped.get(label) || { amount: 0, students: new Set<string>() }
          current.amount += amount
          if (studentId) current.students.add(studentId)
          grouped.set(label, current)
        })
        setDefaulters(
          Array.from(grouped.entries())
            .map(([classLabel, v]) => ({ classLabel, amount: v.amount, students: v.students.size }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3)
        )
      } else {
        setDefaulters([])
      }
    } catch (error) {
      console.error("Dashboard load failed:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard(false)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing School Data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Header & Top Summary Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Principal Dashboard <Badge variant="secondary" className="text-[10px] animate-pulse bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-100">LIVE</Badge>
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Real-time operational depth & school governance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => loadDashboard(true)} disabled={refreshing} className="gap-2 shrink-0">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-500/10 text-emerald-700 p-4 rounded-xl border border-emerald-500/20">
          <p className="text-xs uppercase font-bold opacity-80 mb-1">Collection Today</p>
          <p className="text-2xl font-black">₹{stats.collectionToday.toLocaleString()}</p>
        </div>
        <div className="bg-orange-500/10 text-orange-700 p-4 rounded-xl border border-orange-500/20">
          <p className="text-xs uppercase font-bold opacity-80 mb-1">Absentees</p>
          <p className="text-2xl font-black">{stats.absentees} <span className="text-sm font-medium">Students</span></p>
        </div>
        <div className="bg-blue-500/10 text-blue-700 p-4 rounded-xl border border-blue-500/20">
          <p className="text-xs uppercase font-bold opacity-80 mb-1">New Enquiries</p>
          <p className="text-2xl font-black">{stats.enquiries} <span className="text-sm font-medium">Walk-ins</span></p>
        </div>
        <div className="bg-slate-500/10 text-slate-700 p-4 rounded-xl border border-slate-500/20">
          <p className="text-xs uppercase font-bold opacity-80 mb-1">Staff on Leave</p>
          <p className="text-2xl font-black">{stats.staffOnLeave}</p>
        </div>
      </div>

      {/* 2. Top Row Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/notices">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm h-11 px-6">
            <Megaphone className="w-4 h-4" /> Broadcast Notice
          </Button>
        </Link>
        <Link href="/admin/reports">
          <Button variant="outline" className="gap-2 rounded-xl shadow-sm h-11 px-6 bg-white hover:bg-slate-50">
            <Printer className="w-4 h-4" /> View Day Book
          </Button>
        </Link>
        <Link href="/admin/approvals">
          <Button variant="outline" className="gap-2 rounded-xl shadow-sm h-11 px-6 bg-white hover:bg-slate-50 border-orange-200 hover:border-orange-300 hover:text-orange-700">
            <CheckCircle className="w-4 h-4 text-orange-500" /> Open Approvals
          </Button>
        </Link>
      </div>

      {/* 3. Core Widgets (Max 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Approvals Inbox */}
        <Card className="border-none shadow-sm flex flex-col h-full bg-orange-50/30">
          <CardHeader className="pb-3 border-b border-orange-100 mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><CheckCircle className="w-5 h-5 text-orange-500" /> Approvals Inbox</CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">{approvals.length} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {approvals.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-orange-100/50 shadow-sm">
                <div>
                  <p className="text-sm font-bold text-foreground">{req.student_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {req.request_type} {req.amount ? `(₹${req.amount})` : ''} • {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Link href="/admin/approvals">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            <div className="mt-auto pt-2">
              <Link href="/admin/approvals">
                <Button variant="ghost" className="w-full text-xs text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8">View All Approvals</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Widget 2: Fee Defaulters */}
        <Card className="border-none shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 border-b mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><Banknote className="w-5 h-5 text-red-500" /> Top Defaulters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {defaulters.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-8">
                No defaulter data available
              </div>
            ) : defaulters.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">{i+1}</div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{d.classLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.students} Students</p>
                  </div>
                </div>
                <p className="text-sm font-black text-red-600">₹{d.amount.toLocaleString()}</p>
              </div>
            ))}
            <div className="mt-auto pt-2">
              <Link href="/admin/finance/counter">
                <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8">Open Fee Counter</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Widget 3: Admission Funnel */}
        <Card className="border-none shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 border-b mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><Users className="w-5 h-5 text-blue-500" /> Admission Funnel</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-xs uppercase font-bold tracking-wider text-blue-600">Today&apos;s Admissions Activity</p>
              <p className="mt-2 text-3xl font-black text-foreground">{stats.enquiries}</p>
              <p className="text-xs text-muted-foreground mt-1">Walk-ins / enquiries captured from dashboard command status</p>
              <Progress value={Math.min(stats.enquiries, 100)} className="h-2 mt-4 bg-blue-100 [&>div]:bg-blue-500" />
            </div>
            <div className="mt-auto pt-4">
              <Link href="/admin/admissions/applications">
                <Button variant="ghost" className="w-full text-xs text-blue-600 hover:bg-blue-50 h-8">Manage Admissions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Widget 4: Attendance Overview */}
        <Card className="border-none shadow-sm flex flex-col h-full bg-primary text-primary-foreground">
          <CardHeader className="pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><UserCheck className="w-5 h-5" /> Attendance Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold opacity-80 mb-2">Students Absent</p>
                <p className="text-4xl font-black">{stats.absentees}</p>
                <p className="text-xs font-medium mt-2 opacity-90 text-white/80">Live absent count</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold opacity-80 mb-2">Staff On Leave</p>
                <p className="text-4xl font-black text-emerald-200">{stats.staffOnLeave}</p>
                <p className="text-xs font-medium mt-2 opacity-90 text-emerald-200">Live staff leave count</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget 5: Certificate Requests (Office Desk) */}
        <Card className="border-none shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 border-b mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><FileText className="w-5 h-5 text-indigo-500" /> Pending Certificates</CardTitle>
              {certificates.length > 0 && <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">{certificates.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {certificates.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-8">
                No pending certificate requests
              </div>
            ) : (
              certificates.map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{cert.student_name || cert.name || "Student"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cert.certificate_type || cert.type || "Certificate"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{cert.status || "Pending"}</Badge>
                </div>
              ))
            )}
            <div className="mt-auto pt-2">
              <Link href="/admin/certificates">
                <Button variant="ghost" className="w-full text-xs text-indigo-600 hover:bg-indigo-50 h-8">Issue Certificates</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Widget 6: Student Remarks */}
        <Card className="border-none shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 border-b mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><MessageSquare className="w-5 h-5 text-purple-500" /> Student Remarks</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed bg-purple-50/30 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-foreground">Live remarks feed is not wired yet</p>
                <p className="text-xs text-muted-foreground mt-1">Use Student Remarks to review logs and parent acknowledgements.</p>
              </div>
            </div>
            <div className="mt-auto pt-2">
              <Link href="/admin/diary">
                <Button variant="ghost" className="w-full text-xs text-purple-600 hover:bg-purple-50 h-8">Open Student Remarks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 4. "Also Included" Expandable Section */}
      <div className="mt-8 pt-8 border-t border-border">
         <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
           <LayoutGrid className="w-5 h-5" /> More Modules & Settings
         </h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/timetable" className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:bg-slate-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Timetable</p>
                <p className="text-xs text-muted-foreground">Class schedules</p>
              </div>
            </Link>
            
            <Link href="/admin/exams" className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:bg-slate-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Exams</p>
                <p className="text-xs text-muted-foreground">Presets & Marks</p>
              </div>
            </Link>
            
            <Link href="/admin/transport" className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:bg-slate-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Transport</p>
                <p className="text-xs text-muted-foreground">Routes & Fleet</p>
              </div>
            </Link>

            <Link href="/admin/settings/profile" className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:bg-slate-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white transition-colors">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Settings</p>
                <p className="text-xs text-muted-foreground">System config</p>
              </div>
            </Link>
         </div>
      </div>
    </div>
  );
}
