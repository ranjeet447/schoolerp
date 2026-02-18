"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Users,
  Banknote,
  Bell,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, Button } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

const asArray = (payload: any) => (Array.isArray(payload) ? payload : payload?.data || [])

const parseAmount = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function ParentDashboardPage() {
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
      setChildren([])
      setNotices([])
      setOutstandingTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const recentNotices = useMemo(() => notices.slice(0, 3), [notices])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Parent Portal</h1>
          <p className="text-slate-500">Stay updated with your children's progress and school communications.</p>
        </div>
        <div className="flex -space-x-3">
          {children.slice(0, 2).map((child) => (
            <div key={String(child.id)} className="h-12 w-12 rounded-full border-4 border-white bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
              {String(child.full_name || "?").slice(0, 1).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <Users className="h-5 w-5 text-rose-500" /> My Children
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <div key={String(child.id)} className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold">
                    {String(child.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Roll: {String(child.roll_number || "-")}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{String(child.full_name || "Student")}</h3>
                <p className="text-sm font-medium text-slate-500 mb-2">
                  {String(child.class_name || "Class")} - {String(child.section_name || "Section")}
                </p>
                <div className="text-xs text-slate-500">Admission No: {String(child.admission_number || "-")}</div>
                <div className="mt-6">
                  <Link href={`/parent/children/${child.id}`} className="text-rose-600 font-bold text-xs uppercase tracking-widest hover:underline">
                    View Full Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {!loading && children.length === 0 && (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">No children linked to this account.</div>
          )}

          <Card className="bg-white border-rose-100 rounded-[2rem] shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-rose-50 flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 font-bold">Recent Updates</CardTitle>
              <Bell className="h-5 w-5 text-rose-400" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-rose-50">
                {recentNotices.map((item: any) => (
                  <div key={String(item.id)} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-900">{String(item.title || "Notice")}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-black">{String(item.created_at || "")}</span>
                    </div>
                    <p className="text-xs text-slate-500">{String(item.body || "")}</p>
                  </div>
                ))}
                {!loading && recentNotices.length === 0 && (
                  <div className="p-5 text-xs text-slate-500">No recent updates.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
            <div className="relative z-10">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">
                <Banknote className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Fee Balance</h3>
              <p className="text-slate-400 text-sm mb-6">
                Total outstanding for your children is <span className="text-white font-bold">₹{outstandingTotal.toLocaleString()}</span>.
              </p>
              <Link href="/parent/fees">
                <Button className="w-full h-12 bg-white text-slate-900 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-rose-50 transition-colors">
                  Pay Fees Now
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
          </div>

          <div className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Support</span>
            </div>
            <p className="text-slate-600 text-xs mb-4">Need help with the portal or have an inquiry? </p>
            <Link href="/parent/notices" className="text-rose-600 font-bold text-xs uppercase tracking-widest hover:underline underline-offset-4">
              Contact School Office
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
