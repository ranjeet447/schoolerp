"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@schoolerp/ui"
import { Download, RefreshCw } from "lucide-react"
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
  receipt_number: string
  amount_paid: number
  created_at: string
  payment_mode: string
  admission_number: string
  student_name: string
  tally_ledger_name: string
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

export default function AccountantReportsPage() {
  const defaults = useMemo(() => defaultDateRange(), [])
  const [fromDate, setFromDate] = useState(defaults.from)
  const [toDate, setToDate] = useState(defaults.to)
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [rows, setRows] = useState<BillingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReport = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await apiClient(
        `/accountant/payments/reports/billing?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
      )
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to load billing report")
      }

      const payload = await res.json()
      const rawSummary = payload?.summary || {}
      const rawRows = Array.isArray(payload?.rows) ? payload.rows : []

      setSummary({
        from_date: rawSummary.from_date || fromDate,
        to_date: rawSummary.to_date || toDate,
        receipt_count: Number(rawSummary.receipt_count || 0),
        total_collections: Number(rawSummary.total_collections || 0),
        average_receipt: Number(rawSummary.average_receipt || 0),
        by_mode: typeof rawSummary.by_mode === "object" && rawSummary.by_mode ? rawSummary.by_mode : {},
      })

      setRows(
        rawRows.map((row: any) => ({
          receipt_number: String(row?.receipt_number || "-"),
          amount_paid: Number(row?.amount_paid || 0),
          created_at: String(row?.created_at || ""),
          payment_mode: String(row?.payment_mode || "unknown"),
          admission_number: String(row?.admission_number || "-"),
          student_name: String(row?.student_name || "-"),
          tally_ledger_name: String(row?.tally_ledger_name || "-"),
        })),
      )
    } catch (err) {
      setSummary(null)
      setRows([])
      toast.error(err instanceof Error ? err.message : "Failed to load billing report")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchReport(false)
  }, [])

  const downloadCsv = async () => {
    try {
      const res = await apiClient(
        `/accountant/payments/tally-export?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
      )
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to export CSV")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `billing-report-${fromDate}-to-${toDate}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      toast.success("CSV export downloaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export CSV")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">Billing and collections summary by date range.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchReport(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={downloadCsv} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Button onClick={() => fetchReport(true)} disabled={!fromDate || !toDate || refreshing}>Apply</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Collections</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(summary?.total_collections || 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Receipts Count</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{summary?.receipt_count || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Average Receipt</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(summary?.average_receipt || 0)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collections by Mode</CardTitle>
        </CardHeader>
        <CardContent>
          {!summary || Object.keys(summary.by_mode || {}).length === 0 ? (
            <p className="text-sm text-muted-foreground">No mode breakdown available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(summary.by_mode).map(([mode, amount]) => (
                <div key={mode} className="rounded border p-3">
                  <p className="text-xs uppercase text-muted-foreground">{mode}</p>
                  <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading report...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No receipts found for selected range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Receipt No</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Admission</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2">Ledger</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.receipt_number}-${index}`} className="border-t">
                      <td className="px-3 py-2 text-sm">{row.created_at ? row.created_at.slice(0, 10) : "-"}</td>
                      <td className="px-3 py-2 text-sm font-medium">{row.receipt_number}</td>
                      <td className="px-3 py-2 text-sm">{row.student_name}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{row.admission_number}</td>
                      <td className="px-3 py-2 text-sm capitalize">{row.payment_mode}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{row.tally_ledger_name || "-"}</td>
                      <td className="px-3 py-2 text-sm text-right font-semibold">{formatCurrency(row.amount_paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
