"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge
} from "@schoolerp/ui"
import { Plus, Search, Filter, BookOpen, BrainCircuit } from "lucide-react"
import { QuestionForm } from "./_components/question-form"
import Link from "next/link"

type Question = {
  id: string
  subject_id: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  question_type: "mcq" | "descriptive" | "boolean"
  question_text: string
  marks: number
  created_at: string
}

type Subject = {
  id: string
  name: string
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [topicFilter, setTopicFilter] = useState("")

  useEffect(() => {
    fetchSubjects()
    fetchQuestions()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [selectedSubject, topicFilter])

  const fetchSubjects = async () => {
    const res = await apiClient("/academics/subjects")
    if (res.ok) {
      setSubjects(await res.json())
    }
  }

  const fetchQuestions = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedSubject && selectedSubject !== "all") params.append("subject_id", selectedSubject)
    if (topicFilter) params.append("topic", topicFilter)

    const res = await apiClient(`/exams/questions?${params.toString()}`)
    if (res.ok) {
      setQuestions(await res.json())
    }
    setLoading(false)
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "hard": return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Question Bank</h1>
          <p className="text-slate-400 font-medium">Manage repository of questions for AI paper generation.</p>
        </div>
        <div className="flex gap-2">
           <Link href="/admin/academics/question-bank/generate">
            <Button variant="outline" className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-950/30">
              <BrainCircuit className="h-4 w-4 mr-2" /> AI Generator
            </Button>
          </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-500">
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
              </DialogHeader>
              <QuestionForm 
                subjects={subjects} 
                onSuccess={() => {
                  setOpen(false)
                  fetchQuestions()
                 }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        <div className="w-full md:w-64">
           <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-slate-800/50 border-white/10">
              <SelectValue placeholder="Filter by Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
           </Select>
        </div>
        <div className="w-full md:w-64 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search within topics..." 
            className="pl-9 bg-slate-800/50 border-white/10"
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="grid gap-4">
        {loading ? (
           <div className="text-center py-20 text-slate-500">Loading questions...</div>
        ) : questions.length === 0 ? (
           <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
             <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
             <p>No questions found. Add some to get started!</p>
           </div>
        ) : (
          questions.map(q => (
            <Card key={q.id} className="bg-slate-900/50 border-white/5 hover:bg-slate-900/80 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${getDifficultyColor(q.difficulty)} capitalize`}>
                        {q.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {subjects.find(s => s.id === q.subject_id)?.name || "Unknown Subject"}
                      </Badge>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                        {q.topic}
                      </span>
                      <span className="text-xs text-slate-500">• {q.marks} Marks</span>
                    </div>
                    <p className="font-medium text-lg text-slate-200">{q.question_text}</p>
                    <div className="text-xs text-slate-500 font-mono capitalize">
                      Type: {q.question_type.replace("_", " ")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
