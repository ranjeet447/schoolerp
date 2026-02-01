"use client"

import { useState } from "react"
import { ReportCardPreviewCard } from "@schoolerp/ui"

export default function ParentResultsPage() {
  const [results] = useState([
    {
      examName: "Mid-Term Examination 2025",
      results: [
        { name: "Mathematics", marks: 92, maxMarks: 100 },
        { name: "Science", marks: 88, maxMarks: 100 },
        { name: "English", marks: 75, maxMarks: 100 },
        { name: "History", marks: 85, maxMarks: 100 },
        { name: "Geography", marks: 90, maxMarks: 100 },
      ]
    },
    {
      examName: "Unit Test 1",
      results: [
        { name: "Mathematics", marks: 45, maxMarks: 50 },
        { name: "Science", marks: 42, maxMarks: 50 },
        { name: "English", marks: 38, maxMarks: 50 },
      ]
    }
  ])

  const handleDownload = (examName: string) => {
    alert(`Downloading report card for ${examName}...`)
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Academic Results</h1>
        <p className="text-gray-500 font-medium">Vihaan Gupta • Grade 10 A</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {results.map((exam, idx) => (
          <ReportCardPreviewCard 
            key={idx}
            examName={exam.examName}
            results={exam.results}
            onDownload={() => handleDownload(exam.examName)}
          />
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
          No published results available.
        </div>
      )}
    </div>
  )
}
