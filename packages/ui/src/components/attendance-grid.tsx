import * as React from "react"
import { cn } from "../lib/utils"
import { StatusPill, AttendanceStatus } from "./status-pill"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

interface StudentAttendance {
  id: string
  name: string
  rollNumber: string
  status: AttendanceStatus
  remarks?: string
}

interface AttendanceGridProps {
  students: StudentAttendance[]
  onStatusChange: (studentId: string, status: AttendanceStatus) => void
  onRemarksChange?: (studentId: string, remarks: string) => void
  readOnly?: boolean
}

export function AttendanceGrid({
  students,
  onStatusChange,
  onRemarksChange,
  readOnly,
}: AttendanceGridProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Roll No.</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead className="w-[300px]">Attendance Status</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.rollNumber}</TableCell>
              <TableCell>{student.name}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {(["present", "absent", "late", "halfday"] as AttendanceStatus[]).map(
                    (status) => (
                      <StatusPill
                        key={status}
                        status={status}
                        className={cn(
                          student.status === status
                            ? "ring-2 ring-offset-1 ring-blue-500 font-bold opacity-100"
                            : "opacity-60 grayscale-[0.5]"
                        )}
                        onClick={!readOnly ? () => onStatusChange(student.id, status) : undefined}
                      />
                    )
                  )}
                </div>
              </TableCell>
              <TableCell>
                {readOnly ? (
                  <span className="text-sm text-gray-500">{student.remarks || "-"}</span>
                ) : (
                  <input
                    type="text"
                    className="w-full text-sm border-gray-200 rounded p-1 focus:ring-1 focus:ring-blue-500"
                    placeholder="Note..."
                    value={student.remarks || ""}
                    onChange={(e) => onRemarksChange?.(student.id, e.target.value)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
