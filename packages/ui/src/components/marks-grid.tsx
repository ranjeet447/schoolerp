import * as React from "react"
import { cn } from "../lib/utils"
import { Input } from "./input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

interface Student {
  id: string
  name: string
  marks?: number
  remarks?: string
}

interface MarksGridProps {
  students: Student[]
  maxMarks: number
  onMarksChange: (studentId: string, marks: number) => void
  disabled?: boolean
}

export function MarksGrid({ students, maxMarks, onMarksChange, disabled }: MarksGridProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[100px]">Roll No</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead className="w-[150px] text-center">Marks (Max: {maxMarks})</TableHead>
            <TableHead className="w-[150px] text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, idx) => (
            <TableRow key={student.id} className="hover:bg-gray-50/50">
              <TableCell className="font-mono text-xs text-gray-500">{idx + 1}</TableCell>
              <TableCell className="font-medium text-gray-900">{student.name}</TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Input
                    type="number"
                    value={student.marks ?? ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val) && val <= maxMarks) {
                        onMarksChange(student.id, val)
                      } else if (e.target.value === "") {
                        onMarksChange(student.id, 0)
                      }
                    }}
                    className={cn(
                      "w-20 text-center font-bold",
                      (student.marks ?? 0) < (maxMarks * 0.33) ? "text-red-600 focus-visible:ring-red-500" : "text-green-700 focus-visible:ring-green-500"
                    )}
                    max={maxMarks}
                    disabled={disabled}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right">
                {(student.marks ?? 0) >= (maxMarks * 0.33) ? (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">PASS</span>
                ) : (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">FAIL</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
