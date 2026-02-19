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
  RefreshCw,
  AlertCircle,
  ChevronRight,
  HandMetal,
  UserCheck,
  QrCode
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface TimetableSlot {
  id: string
  period_name: string
  start_time: string
  end_time: string
  subject: string
  class_section: string
  class_section_id: string
  room: string
  is_substitution: boolean
  sub_remarks: string
}

interface AttendanceStats {
  total_students: number
  present_count: number
  absent_count: number
}

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timetable, setTimetable] = useState<TimetableSlot[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [upcomingPeriods, setUpcomingPeriods] = useState<TimetableSlot[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<TimetableSlot | null>(null)

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const dateStr = new Date().toISOString().split("T")[0]
      const [timetableRes, statsRes] = await Promise.all([
        apiClient(`/teacher/schedule/teacher-daily?date=${dateStr}`),
        apiClient(`/teacher/attendance/stats?date=${dateStr}`)
      ])

      if (timetableRes.ok) {
        const data = await timetableRes.json()
        setTimetable(data || [])
        resolveCurrentPeriod(data || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data || null)
      }
    } catch (err) {
      toast.error("Failed to load educator dashboard")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const resolveCurrentPeriod = (slots: TimetableSlot[]) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const current = slots.find(slot => {
      const [sh, sm] = slot.start_time.split(':').map(Number)
      const [eh, em] = slot.end_time.split(':').map(Number)
      const startMinutes = sh * 60 + sm
      const endMinutes = eh * 60 + em
      return currentTime >= startMinutes && currentTime <= endMinutes
    })

    const future = slots.filter(slot => {
      const [sh, sm] = slot.start_time.split(':').map(Number)
      const startMinutes = sh * 60 + sm
      return startMinutes > currentTime
    })

    setCurrentPeriod(current || null)
    setUpcomingPeriods(future)
  }

  useEffect(() => {
    loadDashboard()
    const timer = setInterval(() => resolveCurrentPeriod(timetable), 60000)
    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-slate-500 font-medium font-outfit">Preparing your daily flow...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">Action Center</h1>
          <p className="text-slate-500 font-medium">Streamlined daily operations for modern educators.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="rounded-2xl border-emerald-100 hover:bg-emerald-50 gap-2 font-bold shadow-sm" onClick={() => loadDashboard(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Sync Data
          </Button>
          <Button variant="default" size="lg" className="rounded-2xl bg-slate-900 hover:bg-slate-800 gap-2 font-bold shadow-lg">
            <CalendarCheck className="h-4 w-4" /> My Timetable
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Session Highlight */}
          {currentPeriod ? (
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Clock className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none font-black px-3 py-1 uppercase tracking-widest text-[10px]">Active Now</Badge>
                    {currentPeriod.is_substitution && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 border-none font-black px-3 py-1 uppercase tracking-widest text-[10px]">Substitution</Badge>
                    )}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black font-outfit">{currentPeriod.subject}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{currentPeriod.class_section} • Room {currentPeriod.room}</p>
                  </div>
                  <div className="flex items-center gap-4 text-emerald-400">
                    <Clock className="h-5 w-5" />
                    <span className="text-xl font-bold">{currentPeriod.start_time} - {currentPeriod.end_time}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black px-8 py-6 rounded-3xl h-auto text-lg gap-2"
                    onClick={() => window.location.href = `/teacher/attendance?section_id=${currentPeriod.class_section_id}`}>
                    <UserCheck className="h-6 w-6" /> Smart Attendance
                  </Button>
                  <Button variant="ghost" className="text-white bg-white/5 hover:bg-white/10 rounded-2xl gap-2 font-bold">
                    <BookOpen className="h-4 w-4" /> Lesson Planner
                  </Button>
                </div>
              </div>
              {currentPeriod.is_substitution && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-200 font-medium">Substitution Note: {currentPeriod.sub_remarks || "Handle the class scheduled for absent colleague."}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 flex flex-col items-center justify-center text-center gap-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-outfit">No Active Period</h3>
                <p className="text-slate-500 font-medium max-w-sm mt-1 text-sm">You have no scheduled classes at this moment. Use this time for planning or resource management.</p>
              </div>
              <Button variant="outline" className="rounded-2xl border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold gap-2 mt-2">
                View Full Day <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Daily Schedule List */}
          <Card className="border-emerald-100 rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-emerald-50 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black text-slate-900 font-outfit">Full Day Timeline</CardTitle>
              <span className="text-xs text-slate-400 font-black uppercase tracking-widest">{timetable.length} Sessions Today</span>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2 p-2">
                {timetable.map((slot, idx) => {
                  const isCurrent = currentPeriod?.id === slot.id
                  return (
                    <div key={idx} className={`group flex items-center gap-6 p-6 rounded-[2rem] transition-all cursor-pointer ${isCurrent ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-slate-50'}`}>
                      <div className={`w-24 shrink-0 text-center ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                        <p className="text-sm font-black whitespace-nowrap">{slot.start_time}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Start Time</p>
                      </div>
                      <div className={`h-12 w-1 shadow-sm rounded-full ${isCurrent ? 'bg-white/40' : 'bg-emerald-200 group-hover:bg-emerald-400 transition-colors'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-lg font-black ${isCurrent ? 'text-white' : 'text-slate-900'}`}>{slot.subject}</h4>
                          {slot.is_substitution && <Badge className="bg-amber-400/20 text-amber-600 border-none font-black px-2 py-0.5 text-[10px]">Sub</Badge>}
                        </div>
                        <p className={`text-xs font-bold uppercase tracking-[0.1em] ${isCurrent ? 'text-white/80' : 'text-slate-500'}`}>
                          {slot.class_section} • Room {slot.room}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        {isCurrent ? (
                          <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                        )}
                      </div>
                    </div>
                  )
                })}
                {timetable.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-slate-400 font-medium">No schedule data available for today.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Classes</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{timetable.length}</p>
            </div>
            <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance %</p>
              <p className="text-3xl font-black text-emerald-500 leading-none">
                {stats ? Math.round((stats.present_count / stats.total_students) * 100) : '--'}
              </p>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl space-y-6">
            <h3 className="text-xl font-black font-outfit">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="ghost" className="justify-start bg-white/5 hover:bg-white/10 p-6 rounded-3xl h-auto gap-4 border-none">
                <div className="h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900">
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white leading-tight">Biometric Bridge</p>
                  <p className="text-xs text-white/50">Sync device logs manually</p>
                </div>
              </Button>
              <Button variant="ghost" className="justify-start bg-white/5 hover:bg-white/10 p-6 rounded-3xl h-auto gap-4 border-none">
                <div className="h-10 w-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white leading-tight">Post Notice</p>
                  <p className="text-xs text-white/50">Broadast to your classes</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Upcoming Snapshot */}
          <div className="bg-white border border-emerald-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 font-outfit">Upcoming</h3>
              <Badge variant="outline" className="border-emerald-100 text-emerald-600 font-bold px-3 py-1 text-[10px] uppercase">Next 3</Badge>
            </div>
            <div className="space-y-6">
              {upcomingPeriods.slice(0, 3).map((slot, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">{slot.start_time}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{slot.period_name}</p>
                  </div>
                  <div className="h-10 w-1 bg-emerald-100 rounded-full group-hover:bg-emerald-400 transition-colors" />
                  <div>
                    <p className="font-bold text-slate-900 line-clamp-1">{slot.subject}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{slot.class_section}</p>
                  </div>
                </div>
              ))}
              {upcomingPeriods.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400 font-medium italic">That's all for today! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
