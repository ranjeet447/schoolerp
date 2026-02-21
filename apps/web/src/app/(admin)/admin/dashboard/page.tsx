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
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Command Center <Badge variant="secondary" className="text-[10px] animate-pulse">LIVE</Badge>
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Operational depth & real-time school governance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => loadDashboard(true)} disabled={refreshing} className="gap-2 shrink-0">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Sync Status
          </Button>
          <Button size="sm" className="shrink-0">Generate Report</Button>
        </div>
      </div>

      {/* Primary Operational Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Student Attendance */}
        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative group">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-md">
                    <GraduationCap className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-bold opacity-80">Students</p>
                    <p className="text-2xl font-black leading-none mt-1">{status?.attendance.students.present}/{status?.attendance.students.total}</p>
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-bold">
                    <span>Present Rate</span>
                    <span>{studentPresentRate}%</span>
                 </div>
                 <Progress value={studentPresentRate} className="h-2 bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
              </div>
              <p className="text-xs mt-4 opacity-80 font-medium">Includes {status?.attendance.students.late} late arrivals today</p>
           </CardContent>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
              <Activity size={80} />
           </div>
        </Card>

        {/* Staff Attendance */}
        <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative group">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <UserCheck className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-bold opacity-80">Staff</p>
                    <p className="text-2xl font-black leading-none mt-1">{status?.attendance.staff.present}/{status?.attendance.staff.total}</p>
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-bold">
                    <span>Active Force</span>
                    <span>{staffPresentRate}%</span>
                 </div>
                 <Progress value={staffPresentRate} className="h-2 bg-white/20 [&>div]:bg-white" />
              </div>
              <p className="text-xs mt-4 opacity-80 font-medium">{status?.attendance.staff.absent} staff members on leave</p>
           </CardContent>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
              <Activity size={80} />
           </div>
        </Card>

        {/* Real-time Finance */}
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden group">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center backdrop-blur-md">
                    <Banknote className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Revenue Today</p>
                    <p className="text-2xl font-black text-emerald-400 leading-none mt-1">₹{(status?.finance.collected_today || 0).toLocaleString()}</p>
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] uppercase font-bold text-slate-400">Liquidity Target</p>
                 <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-200">₹{status?.finance.pending_dues.toLocaleString()} Pending</span>
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                 <span className="text-xs text-slate-400 font-medium">Month collection velocity</span>
                 <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/10">+12%</Badge>
              </div>
           </CardContent>
        </Card>

        {/* Academics / Substitutions */}
        <Card className="border-none shadow-sm bg-orange-500 text-white overflow-hidden">
           <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Clock className="h-6 w-6" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-bold opacity-80">Substitutions</p>
                    <p className="text-2xl font-black leading-none mt-1">{status?.academics.active_substitutions}</p>
                 </div>
              </div>
              <div className="bg-black/10 rounded-xl p-3">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold">Pending Assignments</span>
                    <Badge className="bg-white text-orange-600 hover:bg-white text-[10px]">{status?.academics.pending_absences - status?.academics.active_substitutions > 0 ? status?.academics.pending_absences - status?.academics.active_substitutions : 0}</Badge>
                 </div>
                 <Progress value={Math.min(100, (status?.academics.active_substitutions / (status?.academics.pending_absences || 1)) * 100)} className="h-2 bg-white/20 [&>div]:bg-white" />
              </div>
              <Link href="/admin/timetable" className="text-xs mt-4 font-bold flex items-center justify-end hover:underline opacity-90 transition-opacity hover:opacity-100">
                 Resolve Schedule <TrendingUp className="ml-1.5 h-4 w-4" />
              </Link>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admissions and Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm h-full">
             <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                   <CardTitle className="text-lg">Admissions Funnel</CardTitle>
                   <p className="text-sm text-muted-foreground mt-1">Real-time application tracking</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold">View Full Queue</Button>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-border">
                   {applications.length === 0 ? (
                      <div className="p-12 text-center">
                         <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                         <p className="text-sm font-medium text-muted-foreground">No pending applications</p>
                      </div>
                   ) : applications.slice(0, 5).map(app => (
                      <div key={app.id} className="p-5 flex items-center justify-between group hover:bg-muted/50 transition-colors cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                               {app.student_name?.[0] || 'A'}
                            </div>
                            <div>
                               <p className="text-sm font-bold group-hover:text-primary transition-colors">{app.student_name || 'Unnamed Applicant'}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider">
                                     {app.application_number || 'APP-000'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-medium flex items-center before:content-['•'] before:mr-2 before:text-muted-foreground/50">{app.status || 'Received'}</span>
                               </div>
                            </div>
                         </div>
                         <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Review</Button>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Security and Extra Depth */}
        <div className="space-y-6 flex flex-col">
          <Card className="border-none shadow-sm flex-1">
             <CardContent className="p-6">
               <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                     <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                     <CardTitle className="text-lg">Security & Exit</CardTitle>
                     <p className="text-xs text-muted-foreground font-medium mt-0.5">Campus Monitoring</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center"><Users size={16} className="text-muted-foreground" /></div>
                        <span className="text-sm font-semibold">Active Visitors</span>
                     </div>
                     <span className="text-lg font-black text-primary">{status?.security.active_visitors || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center"><AlertCircle size={16} className="text-destructive" /></div>
                        <span className="text-sm font-semibold">Incident Alerts</span>
                     </div>
                     <span className="text-lg font-black text-destructive">{status?.security.recent_alerts || 0}</span>
                  </div>
               </div>

               <div className="mt-8">
                  <p className="text-xs uppercase font-bold text-muted-foreground mb-3">Strategic Fast-Action</p>
                  <div className="grid grid-cols-2 gap-3">
                     <Button variant="outline" className="h-[72px] flex-col gap-2 rounded-xl border-dashed">
                        <Briefcase size={20} className="text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase">Post Notice</span>
                     </Button>
                     <Button variant="outline" className="h-[72px] flex-col gap-2 rounded-xl border-dashed hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors group">
                        <AlertCircle size={20} className="text-destructive group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase text-destructive">Emergency</span>
                     </Button>
                  </div>
               </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground relative overflow-hidden">
             <CardContent className="p-6">
               <h4 className="text-lg font-black tracking-tight leading-tight mb-2">Alpha Insights</h4>
               <p className="text-sm opacity-90 leading-relaxed font-medium">
                  Student attendance is up by <span className="font-bold underline">4%</span> compared to last Thursday. Finance collection velocity is healthy.
               </p>
               <div className="mt-6">
                  <Button asChild variant="secondary" className="w-full font-bold">
                     <Link href="/admin/dashboard/strategy">Open Strategic DSS</Link>
                  </Button>
               </div>
               <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                  <Activity size={120} />
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
