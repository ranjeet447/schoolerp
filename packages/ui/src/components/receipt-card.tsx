import * as React from "react"
import { cn } from "../lib/utils"

interface ReceiptCardProps {
  receiptNumber: string
  studentName: string
  amount: number
  date: string
  mode: string
  status: "issued" | "cancelled"
  onDownload?: () => void
  onCancel?: () => void
}

export function ReceiptCard({
  receiptNumber,
  studentName,
  amount,
  date,
  mode,
  status,
  onDownload,
  onCancel,
}: ReceiptCardProps) {
  return (
    <div className={cn(
      "border rounded-xl p-6 shadow-sm bg-white relative overflow-hidden",
      status === "cancelled" && "opacity-60 grayscale-[0.5]"
    )}>
      {status === "cancelled" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-red-500 text-red-500 font-black text-2xl px-4 py-2 opacity-30 pointer-events-none">
          CANCELLED
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receipt No</span>
          <h3 className="text-sm font-mono font-bold text-gray-900">{receiptNumber}</h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</span>
          <p className="text-sm font-medium text-gray-700">{date}</p>
        </div>
      </div>

      <div className="mb-6">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paid By</span>
        <p className="text-lg font-semibold text-gray-900">{studentName}</p>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</span>
          <p className="text-2xl font-black text-gray-900">₹{amount.toLocaleString()}</p>
        </div>
        <div className="space-x-2 flex">
          {onDownload && (
            <button 
              onClick={onDownload}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              PDF
            </button>
          )}
          {status === "issued" && onCancel && (
            <button 
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center">
        <span className="text-[10px] text-gray-400 font-medium">Payment Mode: <span className="text-gray-600 uppercase italic">{mode}</span></span>
        <div className={cn(
          "w-2 h-2 rounded-full",
          status === "issued" ? "bg-green-500" : "bg-red-500"
        )} />
      </div>
    </div>
  )
}
