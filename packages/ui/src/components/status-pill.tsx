import * as React from "react"
import { cn } from "../lib/utils"

export type AttendanceStatus = "present" | "absent" | "late" | "halfday"

interface StatusPillProps {
  status: AttendanceStatus
  className?: string
  onClick?: () => void
}

const statusStyles: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  absent: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  late: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  halfday: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
}

export function StatusPill({ status, className, onClick }: StatusPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer capitalize",
        statusStyles[status],
        className
      )}
    >
      {status}
    </button>
  )
}
