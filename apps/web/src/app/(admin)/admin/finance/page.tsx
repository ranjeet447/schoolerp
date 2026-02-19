"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input, 
  Label,
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@schoolerp/ui"
import { 
  Download, 
  RefreshCw, 
  Plus, 
  Settings, 
  BarChart3, 
  Receipt, 
  Percent, 
  Clock,
  TrendingUp,
  CreditCard,
  Wallet,
  FileText
} from "lucide-react"
import { toast } from "sonner"

type BillingSummary = {
  from_date: string
  to_date: string
  receipt_count: number
  total_collections: number
  average_receipt: number
  by_mode: Record<string, number>
}

type BillingRow = {
  id: string
  receipt_number: string
  amount_paid: number
  created_at: string
  payment_mode: string
  admission_number: string
  student_name: string
  tally_ledger_name: string
}

type LateFeeRule = {
  id?: string
  fee_head_id?: string
  rule_type: 'fixed' | 'daily'
  amount: number
  grace_days: number
  is_active: boolean
}

type ConcessionRule = {
  id?: string
  name: string
  discount_type: 'percentage' | 'fixed'
  value: number
  category: string
  priority: number
  is_active: boolean
}

type CollectionItem = {
  head_name: string
  total_amount: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0)

const defaultDateRange = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${d}`,
  }
}

export default function AdminFinancePage() {
  const defaults = useMemo(() => defaultDateRange(), [])
  const [fromDate, setFromDate] = useState(defaults.from)
  const [toDate, setToDate] = useState(defaults.to)
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [rows, setRows] = useState<BillingRow[]>([])
  const [collectionReport, setCollectionReport] = useState<CollectionItem[]>([])
  const [lateFeeRules, setLateFeeRules] = useState<LateFeeRule[]>([])
  const [concessionRules, setConcessionRules] = useState<ConcessionRule[]>([])
  const [reminderConfigs, setReminderConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBackendData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Billing Report
      const bilRes = await apiClient(`/admin/payments/reports/billing?from=${fromDate}&to=${toDate}`)
      if (bilRes.ok) {
        const payload = await bilRes.json()
        setSummary(payload.summary)
        setRows(payload.rows || [])
      }

      // 2. Fetch Collection Report (Head-wise)
      const colRes = await apiClient(`/admin/payments/reports/collections?from=${fromDate}&to=${toDate}`)
      if (colRes.ok) {
        const payload = await colRes.json()
        setCollectionReport(payload || [])
      }

      // 3. Fetch Rules
      const lateRes = await apiClient("/admin/rules/late-fees")
      if (lateRes.ok) setLateFeeRules(await lateRes.json())

      const conRes = await apiClient("/admin/rules/concessions")
      if (conRes.ok) setConcessionRules(await conRes.json())

      const remRes = await apiClient("/admin/rules/fee-reminders")
      if (remRes.ok) setReminderConfigs(await remRes.json())

    } catch (err) {
      toast.error("Failed to sync finance data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackendData()
  }, [])

  const downloadCsv = async () => {
    try {
      const res = await apiClient(
        `/admin/payments/tally-export?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
      )
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `billing-export-${fromDate}-to-${toDate}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error("Failed to export CSV")
    }
  }

  const downloadReceipt = async (receiptId: string) => {
    try {
      toast.loading("Preparing receipt...")
      const res = await apiClient(`/admin/payments/receipts/${receiptId}/pdf`)
      if (!res.ok) throw new Error("PDF generation failed")
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `receipt-${receiptId}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.dismiss()
      toast.success("Receipt downloaded")
    } catch (err) {
      toast.dismiss()
      toast.error("Failed to download receipt")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Finance Control</h1>
          <p className="text-slate-400 font-medium">Manage fee rules, track collections, and analyze revenue.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBackendData} disabled={refreshing} className="bg-slate-900 border-white/10 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={downloadCsv} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Download className="h-4 w-4 mr-2" /> Tally Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-slate-900/50 p-1 border border-white/5 rounded-2xl mb-6">
          <TabsTrigger value="dashboard" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="rules" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <Clock className="h-4 w-4 mr-2" /> Late Fees & Discounts
          </TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <Receipt className="h-4 w-4 mr-2" /> Daily Ledger
          </TabsTrigger>
          <TabsTrigger value="automation" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <RefreshCw className="h-4 w-4 mr-2" /> Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Date Filter</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">From Date</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-slate-800/50 border-white/5 rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">To Date</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-slate-800/50 border-white/5 rounded-xl h-11" />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchBackendData} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold">Apply Filter</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border-indigo-500/20 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Collections</p>
                  <h3 className="text-3xl font-black text-white">{formatCurrency(summary?.total_collections || 0)}</h3>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border-emerald-500/20 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Receipts Count</p>
                  <h3 className="text-3xl font-black text-white">{summary?.receipt_count || 0}</h3>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-600/20 to-amber-900/20 border-amber-500/20 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Value</p>
                  <h3 className="text-3xl font-black text-white">{formatCurrency(summary?.average_receipt || 0)}</h3>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-lg font-bold">Revenue by Head</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {collectionReport.length > 0 ? collectionReport.map((item) => (
                    <div key={item.head_name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <span className="font-bold text-slate-300">{item.head_name}</span>
                      <span className="font-black text-white">{formatCurrency(item.total_amount)}</span>
                    </div>
                  )) : (
                    <p className="text-center py-10 text-slate-500">No data for selected period</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-lg font-bold">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(summary?.by_mode || {}).map(([mode, amount]) => (
                    <div key={mode} className="p-5 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{mode}</p>
                      <p className="text-xl font-black text-white">{formatCurrency(amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-400" /> Late Fee Policies
                </CardTitle>
                <Button size="sm" className="bg-indigo-600 rounded-xl h-8 px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {lateFeeRules.length > 0 ? lateFeeRules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white capitalize">{rule.rule_type} Charge</h4>
                      <p className="text-xs text-slate-400">Grace: {rule.grace_days} days | {rule.is_active ? 'Active' : 'Paused'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{formatCurrency(rule.amount)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-10 text-slate-500">No late fee rules defined</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-400" /> Concessions & Discounts
                </CardTitle>
                <Button size="sm" className="bg-emerald-600 rounded-xl h-8 px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {concessionRules.length > 0 ? concessionRules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{rule.name}</h4>
                      <p className="text-xs text-slate-400">Category: {rule.category} | Priority: {rule.priority}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-400">
                        {rule.discount_type === 'percentage' ? `${rule.value}%` : formatCurrency(rule.value)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-10 text-slate-500">No discount rules defined</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Daily Collection Ledger</CardTitle>
                  <p className="text-sm text-slate-400">Chronological list of all payments received.</p>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr className="text-left text-xs uppercase tracking-widest text-slate-500 font-black">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Receipt #</th>
                    <th className="px-8 py-4">Student</th>
                    <th className="px-8 py-4">Admission</th>
                    <th className="px-8 py-4">Mode</th>
                    <th className="px-8 py-4 text-right">Amount</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.length > 0 ? rows.map((row, idx) => (
                    <tr key={`${row.receipt_number}-${idx}`} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5 text-sm text-slate-300 font-medium">{row.created_at.slice(0, 10)}</td>
                      <td className="px-8 py-5 text-sm font-black text-indigo-400">{row.receipt_number}</td>
                      <td className="px-8 py-5 text-sm text-white font-bold">{row.student_name}</td>
                      <td className="px-8 py-5 text-sm text-slate-500">{row.admission_number}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-tighter text-slate-400 group-hover:text-white transition-colors">
                          {row.payment_mode}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-white">{formatCurrency(row.amount_paid)}</td>
                      <td className="px-8 py-5 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => downloadReceipt(row.id)}
                          className="h-8 w-8 p-0 hover:bg-white/10"
                          title="Download PDF"
                        >
                          <FileText className="h-4 w-4 text-slate-400 group-hover:text-indigo-400" />
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-slate-500">No receipts found for this range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle>Add Reminder Schedule</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const data = {
                      days_offset: parseInt(formData.get("offset") as string),
                      reminder_type: formData.get("type"),
                      is_active: true
                    }
                    const res = await apiClient("/admin/rules/fee-reminders", { method: "POST", body: JSON.stringify(data) })
                    if (res.ok) {
                      toast.success("Reminder schedule saved")
                      fetchBackendData()
                      //@ts-ignore
                      e.target.reset()
                    }
                  }} 
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-slate-400">Trigger Offset (Days)</Label>
                    <Input name="offset" type="number" placeholder="e.g. -3 for 3 days before due" className="bg-slate-800/50 border-white/5" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400">Reminder Type</Label>
                    <Select name="type" defaultValue="sms">
                      <SelectTrigger className="bg-slate-800/50 border-white/5">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS / WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="push">App Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold">Add Schedule</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle>Active Reminder Cycles</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {reminderConfigs.length > 0 ? reminderConfigs.map((rem: any) => (
                    <div key={rem.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                          <RefreshCw className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {rem.days_offset === 0 ? "On Due Date" : 
                             rem.days_offset < 0 ? `${Math.abs(rem.days_offset)} Days Before Due` : 
                             `${rem.days_offset} Days After Due`}
                          </p>
                          <p className="text-xs text-slate-500 uppercase font-black">{rem.reminder_type} alert</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${rem.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                          {rem.is_active ? 'Enabled' : 'Disabled'}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={async () => {
                            const res = await apiClient("/admin/rules/fee-reminders", { 
                              method: "POST", 
                              body: JSON.stringify({ ...rem, is_active: !rem.is_active }) 
                            })
                            if (res.ok) {
                              toast.success("Schedule updated")
                              fetchBackendData()
                            }
                          }}
                          className="hover:bg-white/10"
                        >
                          {rem.is_active ? 'Pause' : 'Resume'}
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-10 text-slate-500">No automated reminders configured.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
