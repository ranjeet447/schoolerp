"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { BarChart3, TrendingUp, IndianRupee, RefreshCw, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react"

type CollectionData = {
  date: string
  amount: number
}

type HeadwiseData = {
  head_name: string
  total_amount: number
  percentage: number
}

type ModewiseData = {
  payment_mode: string
  total_amount: number
  count: number
}

type BillingReportPayload = {
  summary?: {
    total_collections?: number
    receipt_count?: number
    average_receipt?: number
    by_mode?: Record<string, number>
  }
  rows?: Array<{
    amount_paid?: number
    created_at?: string
    payment_mode?: string
  }>
}

const BAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500",
  "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"
]

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b",
  "#ec4899", "#6366f1", "#14b8a6", "#f97316"
]

const formatDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const dateRangeForDays = (days: number) => {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - Math.max(days - 1, 0))
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

const parseBillingPayload = (data: any): BillingReportPayload => ({
  summary: data?.summary || {},
  rows: Array.isArray(data?.rows) ? data.rows : [],
})

export default function FinanceDashboardChartsPage() {
  const [period, setPeriod] = useState("30")
  const [loading, setLoading] = useState(true)
  const [dailyCollections, setDailyCollections] = useState<CollectionData[]>([])
  const [headwise, setHeadwise] = useState<HeadwiseData[]>([])
  const [modewise, setModewise] = useState<ModewiseData[]>([])
  const [summary, setSummary] = useState({
    totalCollection: 0,
    receiptCount: 0,
    averageReceipt: 0,
    growthPercent: 0
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const days = parseInt(period, 10)
      const current = dateRangeForDays(days)
      const previousStart = new Date(current.start)
      previousStart.setDate(previousStart.getDate() - days)
      const previousEnd = new Date(current.end)
      previousEnd.setDate(previousEnd.getDate() - days)

      const from = formatDateKey(current.start)
      const to = formatDateKey(current.end)
      const prevFrom = formatDateKey(previousStart)
      const prevTo = formatDateKey(previousEnd)

      const [billingRes, previousBillingRes, headRes] = await Promise.all([
        apiClient(`/admin/payments/reports/billing?from=${from}&to=${to}`),
        apiClient(`/admin/payments/reports/billing?from=${prevFrom}&to=${prevTo}`),
        apiClient(`/admin/payments/reports/collections?from=${from}&to=${to}`),
      ])

      if (!billingRes.ok) {
        throw new Error((await billingRes.text()) || "Failed to load billing report")
      }

      const billingPayload = parseBillingPayload(await billingRes.json())
      const previousPayload = previousBillingRes.ok
        ? parseBillingPayload(await previousBillingRes.json())
        : { summary: {}, rows: [] }

      const summaryData = billingPayload.summary || {}
      const previousTotal = Number(previousPayload.summary?.total_collections || 0)
      const currentTotal = Number(summaryData.total_collections || 0)
      const growthPercent = previousTotal > 0
        ? Number((((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1))
        : 0

      setSummary({
        totalCollection: currentTotal,
        receiptCount: Number(summaryData.receipt_count || 0),
        averageReceipt: Number(summaryData.average_receipt || 0),
        growthPercent,
      })

      const billingRows = Array.isArray(billingPayload.rows) ? billingPayload.rows : []

      const modeMap = new Map<string, ModewiseData>()
      billingRows.forEach((row) => {
        const mode = String(row?.payment_mode || "unknown").toLowerCase()
        const amount = Number(row?.amount_paid || 0)
        const currentMode = modeMap.get(mode) || { payment_mode: mode, total_amount: 0, count: 0 }
        currentMode.total_amount += amount
        currentMode.count += 1
        modeMap.set(mode, currentMode)
      })
      if (modeMap.size === 0 && summaryData.by_mode) {
        Object.entries(summaryData.by_mode).forEach(([mode, amount]) => {
          modeMap.set(mode, { payment_mode: mode, total_amount: Number(amount || 0), count: 0 })
        })
      }
      setModewise(Array.from(modeMap.values()).sort((a, b) => b.total_amount - a.total_amount))

      const dailyTotals = new Map<string, number>()
      billingRows.forEach((row) => {
        const raw = String(row?.created_at || "")
        if (!raw) return
        const day = raw.slice(0, 10)
        dailyTotals.set(day, (dailyTotals.get(day) || 0) + Number(row?.amount_paid || 0))
      })
      const series: CollectionData[] = []
      const cursor = new Date(current.start)
      while (cursor <= current.end) {
        const key = formatDateKey(cursor)
        series.push({ date: key, amount: dailyTotals.get(key) || 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      setDailyCollections(series)

      if (!headRes.ok) {
        throw new Error((await headRes.text()) || "Failed to load fee-head report")
      }
      const headRows = await headRes.json()
      const rows = Array.isArray(headRows) ? headRows : []
      const total = rows.reduce((acc: number, r: any) => acc + Number(r?.total_amount || 0), 0)
      setHeadwise(rows.map((r: any) => ({
        head_name: String(r?.head_name || "Unknown"),
        total_amount: Number(r?.total_amount || 0),
        percentage: total > 0 ? Math.round((Number(r?.total_amount || 0) / total) * 100) : 0,
      })))
    } catch (err: any) {
      setDailyCollections([])
      setHeadwise([])
      setModewise([])
      setSummary({ totalCollection: 0, receiptCount: 0, averageReceipt: 0, growthPercent: 0 })
      toast.error(err?.message || "Failed to load finance charts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [period])

  const maxAmount = Math.max(...dailyCollections.map(d => d.amount), 1)
  const totalHeadwise = headwise.reduce((acc, h) => acc + h.total_amount, 0)

  const formatCurrency = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`
    return `₹${v.toLocaleString()}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Fee Collection & Dues Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Visual analytics for dues, receipts, collections, and payment trends (including UPI collections).</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Collection</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalCollection)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Receipts Issued</p>
              <p className="text-2xl font-bold">{summary.receiptCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Avg Receipt</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.averageReceipt)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${summary.growthPercent >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {summary.growthPercent >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Growth</p>
              <p className="text-2xl font-bold">{summary.growthPercent >= 0 ? '+' : ''}{summary.growthPercent}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Collection Bar Chart (CSS-based) */}
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Daily Collections
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : (
              <div className="h-[300px] flex items-end gap-1 px-2">
                {dailyCollections.map((d, i) => {
                  const height = Math.max((d.amount / maxAmount) * 100, 2)
                  const isToday = d.date === new Date().toISOString().split("T")[0]
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        <p className="font-bold">{formatCurrency(d.amount)}</p>
                        <p>{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${isToday ? 'bg-primary' : 'bg-primary/40 hover:bg-primary/70'}`}
                        style={{ height: `${height}%`, minHeight: "4px" }}
                      />
                      {(i % Math.ceil(dailyCollections.length / 10) === 0 || isToday) && (
                        <span className={`text-[9px] ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Mode Breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" /> By Payment Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {modewise.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No payment data</div>
            ) : (
              <>
                {/* CSS Donut Chart */}
                <div className="relative mx-auto w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      const total = modewise.reduce((a, m) => a + m.total_amount, 0) || 1
                      let cumulative = 0
                      return modewise.map((m, i) => {
                        const pct = (m.total_amount / total) * 100
                        const offset = cumulative
                        cumulative += pct
                        return (
                          <circle
                            key={i}
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            stroke={PIE_COLORS[i % PIE_COLORS.length]}
                            strokeWidth="20"
                            strokeDasharray={`${pct * 2.51} ${251 - pct * 2.51}`}
                            strokeDashoffset={`${-offset * 2.51}`}
                          />
                        )
                      })
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold">{modewise.length}</p>
                      <p className="text-[10px] text-muted-foreground">Modes</p>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {modewise.map((m, i) => {
                    const total = modewise.reduce((a, x) => a + x.total_amount, 0) || 1
                    const pct = Math.round((m.total_amount / total) * 100)
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="capitalize font-medium">{m.payment_mode}</span>
                        </div>
                        <span className="text-muted-foreground font-mono">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Head Breakdown */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" /> Collection by Fee Head
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {headwise.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No fee head data available</div>
          ) : (
            headwise.map((h, i) => {
              const pct = totalHeadwise > 0 ? (h.total_amount / totalHeadwise) * 100 : 0
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{h.head_name}</span>
                    <span className="font-bold">{formatCurrency(h.total_amount)}</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
