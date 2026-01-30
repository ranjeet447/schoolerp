"use client"

import { useState } from "react"
import { ReceiptCard } from "@schoolerp/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function ParentFeesPage() {
  const [receipts] = useState<any[]>([
    {
      id: "1",
      receiptNumber: "REC/2025/0001",
      studentName: "Aarav Sharma",
      amount: 12500,
      date: "2025-06-01",
      mode: "online",
      status: "issued"
    }
  ])

  const totalFees = 50000
  const paidFees = 12500
  const percentage = (paidFees / totalFees) * 100

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fees & Payments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-md border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black">₹{paidFees.toLocaleString()}</span>
              <span className="text-sm font-medium text-gray-400">of ₹{totalFees.toLocaleString()}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-gray-500 font-medium">You have paid {percentage}% of the total annual fees.</p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Payment History</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {receipts.map(r => (
              <ReceiptCard key={r.id} {...r} onDownload={() => alert('Downloading...')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
