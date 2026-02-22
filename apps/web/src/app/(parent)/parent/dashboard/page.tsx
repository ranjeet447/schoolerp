"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Users,
  Banknote,
  Bell,
  ShieldCheck,
  Loader2,
  Calendar,
  BookOpen,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  CreditCard,
  FileText
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"

const asArray = (payload: any) => (Array.isArray(payload) ? payload : payload?.data || [])

const parseAmount = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function ParentActivityFeedPage() {
  const [children, setChildren] = useState<any[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [outstandingTotal, setOutstandingTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchDashboard = async () => {
    setLoading(true)
    setError("")
    try {
      const [childrenRes, noticesRes] = await Promise.all([
        apiClient("/parent/me/children"),
        apiClient("/parent/notices"),
      ])

      if (!childrenRes.ok) {
        const msg = await childrenRes.text()
        throw new Error(msg || "Failed to load children")
      }

      const childrenPayload = await childrenRes.json()
      const childRows = asArray(childrenPayload)
      setChildren(childRows)

      if (noticesRes.ok) {
        const noticesPayload = await noticesRes.json()
        setNotices(asArray(noticesPayload))
      } else {
        setNotices([])
      }

      let outstanding = 0
      if (childRows.length > 0) {
        const summaryResponses = await Promise.all(
          childRows.map((child: any) => apiClient(`/parent/children/${child.id}/fees/summary`)),
        )

        for (const res of summaryResponses) {
          if (!res.ok) continue
          const summary = await res.json()
          const total = parseAmount(summary?.total_amount ?? summary?.total)
          const paid = parseAmount(summary?.paid_amount ?? summary?.paid)
          outstanding += Math.max(0, total - paid)
        }
      }

      setOutstandingTotal(outstanding)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  // Create a unified activity feed (currently just notices, but structured for expansion)
  const activityFeed = useMemo(() => {
    return notices.map(n => ({
      id: n.id,
      type: 'notice',
      title: n.title,
      content: n.body,
      date: n.created_at,
      icon: <Bell className="h-4 w-4 text-rose-500" />,
      color: 'bg-rose-500/10'
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notices]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between px-2 pt-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase italic tracking-tighter">Day <span className="text-rose-600">Feed</span></h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="flex -space-x-3">
          {children.map((child) => (
            <div key={child.id} className="h-10 w-10 rounded-2xl border-2 border-white bg-rose-100 flex items-center justify-center text-rose-600 font-bold shadow-sm">
              {child.full_name?.[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Carousel */}
      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4 px-2">
          <Link href="/parent/fees" className="flex-shrink-0">
            <Button className="h-24 w-28 rounded-[2rem] bg-rose-600 hover:bg-rose-700 flex-col gap-2 shadow-lg shadow-rose-200 border-none transition-transform active:scale-95">
              <CreditCard className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pay Fees</span>
            </Button>
          </Link>
          <Link href="/parent/leaves" className="flex-shrink-0">
            <Button variant="outline" className="h-24 w-28 rounded-[2rem] flex-col gap-2 border-rose-100 bg-white hover:bg-rose-50 transition-transform active:scale-95">
              <Calendar className="h-6 w-6 text-rose-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Leave</span>
            </Button>
          </Link>
          <Link href="/parent/homework" className="flex-shrink-0">
            <Button variant="outline" className="h-24 w-28 rounded-[2rem] flex-col gap-2 border-rose-100 bg-white hover:bg-rose-50 transition-transform active:scale-95">
              <BookOpen className="h-6 w-6 text-rose-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Diary</span>
            </Button>
          </Link>
          <Link href="/parent/results" className="flex-shrink-0">
            <Button variant="outline" className="h-24 w-28 rounded-[2rem] flex-col gap-2 border-rose-100 bg-white hover:bg-rose-50 transition-transform active:scale-95">
              <TrendingUp className="h-6 w-6 text-rose-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Results</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Fee Alert Card (Pinned) */}
      {outstandingTotal > 0 && (
        <Card className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20 border-none mx-2">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-white">
              <Banknote className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest mb-1 text-white/70">Payment Due</h3>
            <div className="text-4xl font-black mb-4">₹{outstandingTotal.toLocaleString()}</div>
            <Link href="/parent/fees" className="w-full">
              <Button className="w-full h-12 bg-white text-slate-900 font-bold uppercase text-xs tracking-widest rounded-2xl hover:bg-rose-50">
                Clear Outstanding
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
        </Card>
      )}

      {/* Activity Feed */}
      <div className="space-y-6 px-2">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
          <TrendingUp className="h-3 w-3" /> Latest Activities
        </h2>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Syncing Feed...</p>
          </div>
        ) : activityFeed.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic font-medium">
             No updates for your children today.
          </div>
        ) : (
          <div className="space-y-4">
            {activityFeed.map((activity) => (
              <div key={activity.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 relative group hover:border-rose-100 transition-colors">
                 <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-xl ${activity.color} flex items-center justify-center shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-black text-slate-900 truncate pr-4">{activity.title}</h4>
                          <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">
                            {format(new Date(activity.date), 'p')}
                          </span>
                       </div>
                       <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{activity.content}</p>
                       <div className="flex items-center justify-between">
                          <Link href="/parent/notices" className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                            Read More <ArrowRight className="h-2 w-2" />
                          </Link>
                          <Badge variant="outline" className="bg-slate-50 border-none text-[8px] font-black text-slate-400 uppercase tracking-tighter">Official Notice</Badge>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Padding for Nav */}
      <div className="h-8" />
    </div>
  )
}
