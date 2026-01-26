import * as React from "react"
import { cn } from "../lib/utils"
import { Progress } from "./progress"
import { FileDown, Trophy, AlertCircle } from "lucide-react"

interface SubjectResult {
  name: string
  marks: number
  maxMarks: number
}

interface ReportCardPreviewCardProps {
  examName: string
  results: SubjectResult[]
  onDownload?: () => void
}

export function ReportCardPreviewCard({
  examName,
  results,
  onDownload,
}: ReportCardPreviewCardProps) {
  const totalObtained = results.reduce((acc, r) => acc + r.marks, 0)
  const totalMax = results.reduce((acc, r) => acc + r.maxMarks, 0)
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0

  const getGrade = (p: number) => {
    if (p >= 90) return { label: "A+", color: "text-green-600" }
    if (p >= 80) return { label: "A", color: "text-green-500" }
    if (p >= 70) return { label: "B", color: "text-blue-600" }
    if (p >= 60) return { label: "C", color: "text-yellow-600" }
    if (p >= 33) return { label: "D", color: "text-orange-600" }
    return { label: "F", color: "text-red-600" }
  }

  const grade = getGrade(percentage)

  return (
    <div className="border rounded-2xl p-6 shadow-md bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Trophy size={120} />
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-black text-gray-900">{examName}</h3>
          <p className="text-sm text-gray-500 font-medium">Academic Report Card Summary</p>
        </div>
        {onDownload && (
          <button 
            onClick={onDownload}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors hover:bg-gray-800"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aggregate percentage</span>
              <p className={cn("text-4xl font-black", grade.color)}>{percentage.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Final Grade</span>
              <p className={cn("text-4xl font-black", grade.color)}>{grade.label}</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalObtained} / {totalMax}</p>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Total Marks</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Subject Wise Breakdown</h4>
        <div className="space-y-2">
          {results.map((r, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-700">{r.name}</span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-gray-400">{r.maxMarks}</span>
                <span className={cn("font-bold w-12 text-right", r.marks >= r.maxMarks * 0.33 ? "text-gray-900" : "text-red-600")}>
                  {r.marks}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex items-center gap-2 text-[10px] text-gray-400 font-medium">
        <AlertCircle className="w-3 h-3" />
        This is an electronically generated report. For official use, please request a signed copy.
      </div>
    </div>
  )
}
