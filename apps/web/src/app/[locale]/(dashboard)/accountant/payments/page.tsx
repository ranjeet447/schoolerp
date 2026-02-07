"use client"

import { useState } from "react"
import { ReceiptCard } from "@schoolerp/ui"
import { Button, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@schoolerp/ui"
import { Input } from "@schoolerp/ui"
import { Label } from "@schoolerp/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"

export default function AccountantPaymentsPage() {
  const [loading, setLoading] = useState(false)
  const [receipts, setReceipts] = useState<any[]>([])

  const handleCollect = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const newReceipt = {
        id: Math.random(),
        receiptNumber: `REC/2025/000${receipts.length + 1}`,
        studentName: "Aarav Sharma",
        amount: 5000,
        date: new Date().toISOString().split("T")[0],
        mode: "cash",
        status: "issued"
      }
      setReceipts([newReceipt, ...receipts])
      alert("Payment collected and receipt generated!")
      setLoading(false)
    }, 1000)
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
                <Label>Search Student</Label>
                <Input placeholder="Admission No or Name" />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select required>
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
                <Label>Remarks</Label>
                <Input placeholder="Note..." />
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
            {receipts.map(r => (
              <ReceiptCard key={r.id} {...r} onDownload={() => alert('Downloading...')} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
