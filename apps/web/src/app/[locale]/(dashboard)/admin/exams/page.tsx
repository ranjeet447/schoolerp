"use client"

import { useState } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Badge } from "@schoolerp/ui"
import { Calendar, Plus } from "lucide-react"

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([
    { id: "1", name: "Mid-Term Examination 2025", status: "conducting", start_date: "2025-06-15", end_date: "2025-06-25" },
    { id: "2", name: "Final Term Examination 2025", status: "draft", start_date: "2025-11-01", end_date: "2025-11-15" }
  ])

  const [newName, setNewName] = useState("")

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const newExam = {
      id: Math.random().toString(),
      name: newName,
      status: "draft",
      start_date: "TBD",
      end_date: "TBD"
    }
    setExams([...exams, newExam])
    setNewName("")
    alert("Exam created successfully!")
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Examination Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Exam</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input 
                    placeholder="e.g. Unit Test 1" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Exam
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Planned Exams</h2>
          <div className="space-y-4">
            {exams.map(exam => (
              <Card key={exam.id} className="hover:border-blue-200 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{exam.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {exam.start_date} - {exam.end_date}
                      </div>
                      <Badge variant={exam.status === "published" ? "default" : "secondary"} className="capitalize">
                        {exam.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Manage Subjects</Button>
                    <Button variant="default" size="sm">Publish</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
