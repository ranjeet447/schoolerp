"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Bell,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Loader2
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"

export default function StudentDashboardPage() {
  const [homework, setHomework] = useState<any[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchDashboard = async () => {
    setLoading(true)
    setError("")
    try {
      const [hwRes, noticesRes] = await Promise.all([
        apiClient("/student/me/homework/pending"),
        apiClient("/student/notices"),
      ])

      if (hwRes.ok) {
        const hwData = await hwRes.json()
        setHomework(Array.isArray(hwData) ? hwData : hwData.data || [])
      }

      if (noticesRes.ok) {
        const noticesData = await noticesRes.json()
        setNotices(Array.isArray(noticesData) ? noticesData : noticesData.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            My <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </p>
        </div>
        <div className="flex gap-3">
           <Link href="/student/homework">
             <Button className="rounded-2xl gap-2 font-bold uppercase text-[10px] tracking-widest px-6 italic">
               <BookOpen className="h-4 w-4" /> My Tasks
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          {/* Homework Section */}
          <section className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock className="h-3 w-3" /> Priority Tasks
            </h2>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-200 mb-4" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Tasks...</p>
              </div>
            ) : homework.length === 0 ? (
              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-[2rem] p-12 text-center">
                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <CheckCircle2 className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 italic uppercase tracking-tight">All Caught Up!</h3>
                <p className="text-slate-500 text-sm mt-1">No pending homework assignments found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {homework.map((hw) => (
                  <Card key={hw.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight italic">{hw.title}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{hw.subject_name}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="rounded-xl bg-orange-50 text-orange-600 border-none px-3 py-1 text-[10px] font-black uppercase">
                          Due in {format(new Date(hw.due_date), 'dd MMM')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Notices Section */}
          <section className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Bell className="h-3 w-3" /> Campus News
            </h2>
            <div className="grid gap-4">
                {notices.length === 0 && !loading && (
                    <p className="text-slate-400 text-sm italic py-10 text-center">No recent notices.</p>
                )}
                {notices.map((notice) => (
                  <div key={notice.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 hover:border-indigo-100 transition-colors">
                     <h4 className="text-sm font-black text-slate-900 italic uppercase mb-2">{notice.title}</h4>
                     <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{notice.body}</p>
                     <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{format(new Date(notice.created_at), 'PPP')}</span>
                        <Link href={`/student/notices`} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Read Story</Link>
                     </div>
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           {/* Quick Stats */}
           <Card className="rounded-[2.5rem] bg-indigo-600 border-none text-white p-8 shadow-xl shadow-indigo-200">
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-100">Attendance</h3>
                    <p className="text-3xl font-black italic tracking-tighter">94.2%</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Calendar className="h-4 w-4" />
                       <span className="text-xs font-bold">This Month</span>
                    </div>
                    <span className="text-xs font-black">22/24</span>
                 </div>
                 <Button variant="ghost" className="w-full text-white hover:bg-white/10 rounded-xl uppercase text-[10px] font-black tracking-widest">
                    View Full History
                 </Button>
              </div>
           </Card>

           {/* Quick Links */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Links</h3>
              <div className="grid gap-2">
                 <Link href="/student/results">
                   <Button variant="outline" className="w-full justify-start gap-3 rounded-2xl border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 group transition-all">
                      <GraduationCap className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                      <span className="text-xs font-bold">Academic Performance</span>
                   </Button>
                 </Link>
                 <Link href="/student/timetable">
                   <Button variant="outline" className="w-full justify-start gap-3 rounded-2xl border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 group transition-all">
                      <Clock className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                      <span className="text-xs font-bold">Weekly Timetable</span>
                   </Button>
                 </Link>
                 <Link href="/student/resources">
                   <Button variant="outline" className="w-full justify-start gap-3 rounded-2xl border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 group transition-all">
                      <FileText className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                      <span className="text-xs font-bold">Learning Materials</span>
                   </Button>
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
