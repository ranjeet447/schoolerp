import * as React from "react"
import { cn } from "../lib/utils"
import { StatusPill, AttendanceStatus } from "./status-pill"

interface LeaveRequestCardProps {
  studentName: string
  admissionNumber: string
  from: string
  to: string
  reason: string
  status: "pending" | "approved" | "rejected"
  onApprove?: () => void
  onReject?: () => void
}

export function LeaveRequestCard({
  studentName,
  admissionNumber,
  from,
  to,
  reason,
  status,
  onApprove,
  onReject,
}: LeaveRequestCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-900">{studentName}</h4>
          <p className="text-sm text-gray-500">{admissionNumber}</p>
        </div>
        <div className="capitalize px-2 py-0.5 rounded text-xs font-medium border border-gray-200 bg-gray-50">
          {status}
        </div>
      </div>
      
      <div className="space-y-2 mt-3">
        <div className="flex text-sm">
          <span className="text-gray-500 w-20">Duration:</span>
          <span className="text-gray-900 font-medium">{from} to {to}</span>
        </div>
        <div className="flex text-sm">
          <span className="text-gray-500 w-20">Reason:</span>
          <p className="text-gray-700">{reason}</p>
        </div>
      </div>

      {status === "pending" && (onApprove || onReject) && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {onApprove && (
            <button
              onClick={onApprove}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  )
}
