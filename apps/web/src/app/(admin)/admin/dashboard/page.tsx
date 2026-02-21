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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Mocked stats for the top strip & widgets to reflect UX strategy immediately
  const [stats, setStats] = useState({
    collectionToday: 125000,
    absentees: 45,
    enquiries: 12,
    staffOnLeave: 3
  })

  // Mock data for widgets
  const approvals = [
    { id: 1, type: "Waiver", name: "Aarav Sharma", amount: "₹500", time: "10 mins ago" },
    { id: 2, type: "Concession", name: "Diya Patel", amount: "10%", time: "1 hour ago" },
    { id: 3, type: "TC Request", name: "Rohan Verma", amount: "Class X", time: "2 hours ago" },
  ]
  const defaulters = [
    { class: "Class X-A", amount: "₹45,000", students: 8 },
    { class: "Class IX-B", amount: "₹38,000", students: 6 },
    { class: "Class VIII-A", amount: "₹32,500", students: 5 },
  ]
  const certificates = [
    { id: 1, type: "Transfer Certificate", name: "Arjun Kumar", status: "Pending" },
    { id: 2, type: "Bonafide", name: "Sneha Gupta", status: "Pending" },
  ]
  const remarks = [
    { name: "Rahul Singh", desc: "Excellent project in Science.", teacher: "Mr. Sharma", time: "2h ago" },
    { name: "Priya Das", desc: "Incomplete Math homework.", teacher: "Mrs. Verma", time: "3h ago" },
  ]

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    
    // Simulate real data load
    setTimeout(() => {
      setLoading(false)
      setRefreshing(false)
    }, 800)
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
        <Link href="/admin/communication/notices">
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
                  <p className="text-sm font-bold text-foreground">{req.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{req.type} ({req.amount}) • {req.time}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"><CheckCircle className="w-4 h-4" /></Button>
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
            {defaulters.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">{i+1}</div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{d.class}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.students} Students</p>
                  </div>
                </div>
                <p className="text-sm font-black text-red-600">{d.amount}</p>
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
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Walk-ins (Enquiries)</span>
                  <span>145</span>
                </div>
                <Progress value={100} className="h-2 bg-blue-100 [&>div]:bg-blue-300" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Applications Received</span>
                  <span>82</span>
                </div>
                <Progress value={(82/145)*100} className="h-2 bg-blue-100 [&>div]:bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Admitted (Fees Paid)</span>
                  <span className="text-emerald-600">45</span>
                </div>
                <Progress value={(45/145)*100} className="h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
              </div>
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
            <div className="grid grid-cols-2 gap-4 divide-x divide-white/10">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold opacity-80 mb-2">Student Force</p>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="opacity-20" />
                    <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="226.2" strokeDashoffset={226.2 - (226.2 * 94) / 100} className="text-white" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-black">94%</span>
                  </div>
                </div>
                <p className="text-xs font-medium mt-2 opacity-90 text-white/80">45 Absent</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold opacity-80 mb-2">Staff Force</p>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="opacity-20" />
                    <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="226.2" strokeDashoffset={226.2 - (226.2 * 96) / 100} className="text-emerald-400" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-black">96%</span>
                  </div>
                </div>
                <p className="text-xs font-medium mt-2 opacity-90 text-emerald-200">3 on Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget 5: Certificate Requests (Office Desk) */}
        <Card className="border-none shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 border-b mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><FileText className="w-5 h-5 text-indigo-500" /> Pending Certificates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {certificates.map(cert => (
              <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{cert.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cert.type}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">Review</Button>
              </div>
            ))}
            <div className="mt-auto pt-2">
              <Link href="/admin/certificates">
                <Button variant="ghost" className="w-full text-xs text-indigo-600 hover:bg-indigo-50 h-8">Issue Certificates</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Widget 6: Recent Remarks (Teacher Diary) */}
        <Card className="border-none shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 border-b mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 tracking-tight"><MessageSquare className="w-5 h-5 text-purple-500" /> Live Remarks Feed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {remarks.map((r, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 text-purple-600 font-bold text-xs">{r.name[0]}</div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5"><span className="font-bold text-foreground">{r.name}</span> by {r.teacher}</p>
                  <p className="text-sm font-medium leading-snug">{r.desc}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.time}</p>
                </div>
              </div>
            ))}
            <div className="mt-auto pt-2">
              <Link href="/admin/diary">
                <Button variant="ghost" className="w-full text-xs text-purple-600 hover:bg-purple-50 h-8">View Teacher Diary</Button>
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

            <Link href="/admin/settings" className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:bg-slate-50 transition-colors group">
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
