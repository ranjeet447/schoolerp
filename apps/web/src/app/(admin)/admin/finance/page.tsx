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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Finance Control</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage fee rules, track collections, and analyze revenue.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBackendData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={downloadCsv}>
            <Download className="h-4 w-4 mr-2" /> Tally Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-3xl">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Clock className="h-4 w-4" /> Late Fees & Discounts
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2">
            <Receipt className="h-4 w-4" /> Daily Ledger
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Date Filter</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>From Date</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>To Date</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchBackendData} className="w-full h-10">Apply Filter</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Collections</p>
                    <h3 className="text-3xl font-black text-foreground mt-1">{formatCurrency(summary?.total_collections || 0)}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-emerald-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Receipts Count</p>
                    <h3 className="text-3xl font-black text-foreground mt-1">{summary?.receipt_count || 0}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-amber-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Average Value</p>
                    <h3 className="text-3xl font-black text-foreground mt-1">{formatCurrency(summary?.average_receipt || 0)}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Head</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collectionReport.length > 0 ? collectionReport.map((item) => (
                    <div key={item.head_name} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <span className="font-semibold text-sm text-foreground">{item.head_name}</span>
                      <span className="font-bold text-foreground">{formatCurrency(item.total_amount)}</span>
                    </div>
                  )) : (
                    <p className="text-center py-10 text-muted-foreground text-sm">No data for selected period</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(summary?.by_mode || {}).map(([mode, amount]) => (
                    <div key={mode} className="p-4 bg-muted/40 rounded-xl border border-border/50 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{mode}</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" /> Late Fee Policies
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Rule
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {lateFeeRules.length > 0 ? lateFeeRules.map((rule) => (
                  <div key={rule.id} className="p-3 bg-muted/40 rounded-xl border border-border/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground capitalize">{rule.rule_type} Charge</h4>
                      <p className="text-xs text-muted-foreground mt-1">Grace: {rule.grace_days} days | {rule.is_active ? 'Active' : 'Paused'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">{formatCurrency(rule.amount)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl">
                    <p className="text-muted-foreground text-sm font-medium">No late fee rules defined.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Percent className="h-5 w-5 text-primary" /> Concessions & Discounts
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Discount
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {concessionRules.length > 0 ? concessionRules.map((rule) => (
                  <div key={rule.id} className="p-3 bg-muted/40 rounded-xl border border-border/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{rule.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Category: {rule.category} | Priority: {rule.priority}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-emerald-600">
                        {rule.discount_type === 'percentage' ? `${rule.value}%` : formatCurrency(rule.value)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl">
                    <p className="text-muted-foreground text-sm font-medium">No discount rules defined.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Daily Collection Ledger</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Chronological list of all payments received.</p>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-y">
                  <tr className="text-muted-foreground font-semibold">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Receipt #</th>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Admission</th>
                    <th className="px-6 py-3">Mode</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.length > 0 ? rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{row.created_at.slice(0, 10)}</td>
                      <td className="px-6 py-4 font-mono text-primary">{row.receipt_number}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{row.student_name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{row.admission_number}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-muted rounded-md text-xs font-semibold text-muted-foreground capitalize">
                          {row.payment_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">{formatCurrency(row.amount_paid)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => downloadReceipt(row.id)}
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          title="Download PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Receipt className="h-8 w-8 text-muted-foreground/40" />
                          <p>No receipts found for this range.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Add Reminder Schedule</CardTitle>
              </CardHeader>
              <CardContent>
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
                    <Label>Trigger Offset (Days)</Label>
                    <Input name="offset" type="number" placeholder="e.g. -3 for 3 days before due" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reminder Type</Label>
                    <Select name="type" defaultValue="sms">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS / WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="push">App Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full h-10">Add Schedule</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Active Reminder Cycles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reminderConfigs.length > 0 ? reminderConfigs.map((rem: any) => (
                    <div key={rem.id} className="p-4 bg-muted/40 border border-border/50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <RefreshCw className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {rem.days_offset === 0 ? "On Due Date" : 
                             rem.days_offset < 0 ? `${Math.abs(rem.days_offset)} Days Before Due` : 
                             `${rem.days_offset} Days After Due`}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{rem.reminder_type} alert</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${rem.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
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
                          className="h-8 text-xs font-semibold"
                        >
                          {rem.is_active ? 'Pause' : 'Resume'}
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl">
                      <p className="text-muted-foreground text-sm font-medium">No automated reminders configured.</p>
                    </div>
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
