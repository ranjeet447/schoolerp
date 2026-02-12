"use client"

import { useState } from "react"
import { MarksGrid, Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@schoolerp/ui"
import { Save } from "lucide-react"
import { toast } from "sonner"

export default function TeacherMarksPage() {
  const [students, setStudents] = useState<any[]>([
    { id: '1', name: 'Aarav Sharma', marks: 85 },
    { id: '2', name: 'Ishani Roy', marks: 25 },
    { id: '3', name: 'Kabir Singh', marks: 95 },
    { id: '4', name: 'Saira Banu', marks: 45 },
    { id: '5', name: 'Vihaan Gupta', marks: 78 },
  ])

  const handleMarksChange = (id: string, marks: number) => {
    setStudents(students.map(s => s.id === id ? { ...s, marks } : s))
  }

  const handleSave = () => {
    toast.success("Marks saved successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marks Entry</h1>
          <p className="text-gray-500">Mid-Term Examination 2025 • Mathematics</p>
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <MarksGrid 
            students={students} 
            maxMarks={100} 
            onMarksChange={handleMarksChange} 
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end text-xs text-gray-400 font-medium">
        Last saved today at 10:30 AM
      </div>
    </div>
  )
}
