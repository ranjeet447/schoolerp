"use client"

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Banknote, 
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  Clock,
  Briefcase,
  Activity,
  UserCheck
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge,
  Progress 
} from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface CommandStatus {
  attendance: {
    students: { present: number; absent: number; late: number; total: number }
    staff: { present: number; absent: number; total: number }
  }
  finance: {
    collected_today: number
    target_month: number
    pending_dues: number
  }
  academics: {
    active_substitutions: number
    pending_absences: number
  }
  security: {
    active_visitors: number
    recent_alerts: number
  }
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
  const [status, setStatus] = useState<CommandStatus | null>(null)
  const [applications, setApplications] = useState<AdmissionApplication[]>([])

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const [statusRes, applicationsRes] = await Promise.all([
        apiClient('/admin/dashboard/command-status'),
        apiClient('/admin/admissions/applications?limit=10'),
      ])

      if (statusRes.ok) {
        setStatus(await statusRes.json())
      }
      if (applicationsRes.ok) {
        setApplications(await applicationsRes.json())
      }
    } catch (err) {
      setError('Failed to sync with command center')
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
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Command Center...</p>
      </div>
    )
  }

  const studentPresentRate = status?.attendance.students.total 
    ? Math.round((status.attendance.students.present / status.attendance.students.total) * 100) 
    : 0

  const staffPresentRate = status?.attendance.staff.total 
    ? Math.round((status.attendance.staff.present / status.attendance.staff.total) * 100) 
    : 0

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
            Command Center <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] animate-pulse">LIVE</Badge>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Operational depth & real-time school governance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => loadDashboard(true)} disabled={refreshing} className="rounded-full px-4 h-9">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Sync Status
          </Button>
          <Button size="sm" className="rounded-full px-6 h-9 shadow-lg shadow-primary/20">Generate Report</Button>
        </div>
      </div>

      {/* Primary Operational Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Student Attendance */}
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative group">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <GraduationCap className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-black opacity-60">Students</p>
                    <p className="text-2xl font-black">{status?.attendance.students.present}/{status?.attendance.students.total}</p>
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-bold">
                    <span>Present Rate</span>
                    <span>{studentPresentRate}%</span>
                 </div>
                 <Progress value={studentPresentRate} className="h-1.5 bg-white/20" />
              </div>
              <p className="text-[10px] mt-4 opacity-70 font-medium">Includes {status?.attendance.students.late} late arrivals today</p>
           </CardContent>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity size={80} />
           </div>
        </Card>

        {/* Staff Attendance */}
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative group">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <UserCheck className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-black opacity-60">Staff</p>
                    <p className="text-2xl font-black">{status?.attendance.staff.present}/{status?.attendance.staff.total}</p>
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-bold">
                    <span>Active Force</span>
                    <span>{staffPresentRate}%</span>
                 </div>
                 <Progress value={staffPresentRate} className="h-1.5 bg-white/20" />
              </div>
              <p className="text-[10px] mt-4 opacity-70 font-medium">{status?.attendance.staff.absent} staff members on leave</p>
           </CardContent>
        </Card>

        {/* Real-time Finance */}
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white overflow-hidden group">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center backdrop-blur-md">
                    <Banknote className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-slate-500">Revenue Today</p>
                    <p className="text-2xl font-black text-emerald-400">₹{(status?.finance.collected_today || 0).toLocaleString()}</p>
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] uppercase font-bold text-slate-500">Liquidity Target</p>
                 <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-300">₹{status?.finance.pending_dues.toLocaleString()} Pending</span>
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                 <span className="text-[10px] text-slate-400">Month collection velocity</span>
                 <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-500">+12%</Badge>
              </div>
           </CardContent>
        </Card>

        {/* Academics / Substitutions */}
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-orange-500 text-white overflow-hidden">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Clock className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-black opacity-60">Substitutions</p>
                    <p className="text-2xl font-black">{status?.academics.active_substitutions}</p>
                 </div>
              </div>
              <div className="bg-black/10 rounded-2xl p-3">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold">Pending Assignments</span>
                    <Badge className="bg-white text-orange-600 text-[9px] h-4">{status?.academics.pending_absences - status?.academics.active_substitutions > 0 ? status?.academics.pending_absences - status?.academics.active_substitutions : 0}</Badge>
                 </div>
                 <Progress value={Math.min(100, (status?.academics.active_substitutions / (status?.academics.pending_absences || 1)) * 100)} className="h-1 bg-white/20" />
              </div>
              <Link href="/admin/timetable" className="text-[10px] mt-4 font-bold flex items-center justify-end hover:underline">
                 Resolve Schedule <TrendingUp className="ml-1 h-3 w-3" />
              </Link>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Admissions and Feed */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2rem] shadow-none border-border/50 bg-card/50 overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between p-6">
                <div>
                   <CardTitle className="text-lg font-black uppercase tracking-tight">Admissions Funnel</CardTitle>
                   <p className="text-xs text-muted-foreground mt-0.5">Real-time application tracking</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">View Full Queue</Button>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                   {applications.length === 0 ? (
                      <div className="p-10 text-center">
                         <AlertCircle className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                         <p className="text-sm font-medium text-muted-foreground">No pending applications</p>
                      </div>
                   ) : applications.slice(0, 5).map(app => (
                      <div key={app.id} className="p-5 flex items-center justify-between group hover:bg-muted/30 transition-all cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                               {app.student_name?.[0] || 'A'}
                            </div>
                            <div>
                               <p className="text-sm font-bold group-hover:text-primary transition-colors">{app.student_name || 'Unnamed Applicant'}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[8px] h-3.5 uppercase tracking-tighter opacity-60">
                                     {app.application_number || 'APP-000'}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground font-medium">• {app.status || 'Received'}</span>
                               </div>
                            </div>
                         </div>
                         <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Review</Button>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Security and Extra Depth */}
        <div className="space-y-8">
          <Card className="rounded-[2rem] border-none bg-slate-100 dark:bg-slate-800/50 p-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                   <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase tracking-tight">Security & Exit</h3>
                   <p className="text-[10px] text-muted-foreground font-bold">Campus Monitoring</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-border/50">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Users size={14} className="text-slate-500" /></div>
                      <span className="text-xs font-bold">Active Visitors</span>
                   </div>
                   <span className="text-sm font-black text-primary">{status?.security.active_visitors || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-border/50">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><AlertCircle size={14} className="text-rose-500" /></div>
                      <span className="text-xs font-bold">Incident Alerts</span>
                   </div>
                   <span className="text-sm font-black text-rose-500">{status?.security.recent_alerts || 0}</span>
                </div>
             </div>

             <div className="mt-8">
                <p className="text-[10px] uppercase font-black text-muted-foreground mb-4">Strategic Fast-Action</p>
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="outline" className="h-16 flex-col gap-1 rounded-2xl border-dashed">
                      <Briefcase size={16} />
                      <span className="text-[9px] font-black uppercase">Post Notice</span>
                   </Button>
                   <Button variant="outline" className="h-16 flex-col gap-1 rounded-2xl border-dashed">
                      <AlertCircle size={16} className="text-rose-500" />
                      <span className="text-[9px] font-black uppercase text-rose-500">Emergency</span>
                   </Button>
                </div>
             </div>
          </Card>

          <div className="p-6 rounded-[2rem] bg-indigo-600 text-white relative overflow-hidden">
             <h4 className="text-lg font-black uppercase leading-tight mb-2">Alpha Insights</h4>
             <p className="text-xs opacity-80 leading-relaxed font-medium">
                Student attendance is up by 4% compared to last Thursday. Finance collection velocity is healthy.
             </p>
             <div className="mt-6">
                <Button asChild variant="secondary" size="sm" className="w-full rounded-xl font-bold text-xs h-9">
                   <Link href="/admin/dashboard/strategy">Open Strategic DSS</Link>
                </Button>
             </div>
             <div className="absolute -bottom-4 -right-4 opacity-10">
                <Activity size={100} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
