"use client"

import { useState } from "react"
import { ReceiptCard } from "@schoolerp/ui"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@schoolerp/ui"
import { Input } from "@schoolerp/ui"
import { Label } from "@schoolerp/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function AccountantPaymentsPage() {
  const [loading, setLoading] = useState(false)
  const [receipts, setReceipts] = useState<any[]>([])
  const [studentID, setStudentID] = useState("")
  const [amount, setAmount] = useState("")
  const [mode, setMode] = useState("cash")
  const [transactionRef, setTransactionRef] = useState("")

  const fetchReceipts = async (targetStudentID: string) => {
    if (!targetStudentID) {
      setReceipts([])
      return
    }

    try {
      const res = await apiClient(`/accountant/payments/receipts?student_id=${encodeURIComponent(targetStudentID)}`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load receipts")
      }
      const payload = await res.json()
      setReceipts(Array.isArray(payload) ? payload : payload?.data || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load receipts")
      setReceipts([])
    }
  }

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentID || !amount || Number(amount) <= 0) {
      toast.error("Student ID and valid amount are required")
      return
    }

    setLoading(true)

    try {
      const res = await apiClient("/accountant/payments/offline", {
        method: "POST",
        body: JSON.stringify({
          student_id: studentID,
          amount: Number(amount),
          mode,
          transaction_ref: transactionRef,
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to issue receipt")
      }

      await fetchReceipts(studentID)
      setAmount("")
      setTransactionRef("")
      toast.success("Payment collected and receipt generated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to collect payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Collect Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCollect} className="space-y-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  placeholder="Paste student UUID"
                  value={studentID}
                  onChange={(e) => setStudentID(e.target.value)}
                />
                <Button type="button" variant="outline" className="w-full" onClick={() => fetchReceipts(studentID)} disabled={!studentID || loading}>
                  Load Student Receipts
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={mode} onValueChange={setMode} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="upi">UPI / Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction Reference</Label>
                <Input placeholder="Optional UPI/Bank/Cheque ref" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : "Issue Receipt"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold">Recent Receipts</h2>
        {receipts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
            No receipts issued recently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receipts.map((r) => {
              const status = String(r.status || "issued").toLowerCase() === "cancelled" ? "cancelled" : "issued"
              return (
                <ReceiptCard
                  key={String(r.id)}
                  receiptNumber={String(r.receipt_number || r.receiptNumber || "-")}
                  studentName={String(r.student_name || r.studentName || "Student")}
                  amount={Number(r.amount_paid || r.amount || 0)}
                  date={String(r.created_at || r.date || "")}
                  mode={String(r.payment_mode || r.mode || "offline")}
                  status={status}
                  onDownload={() => toast.info("PDF download integration pending")}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
