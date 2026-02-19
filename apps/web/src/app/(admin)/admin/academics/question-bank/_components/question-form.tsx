"use client"

import { useState } from "react"
import { 
  Button, 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  Label,
  Textarea
} from "@schoolerp/ui"
import { Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface QuestionFormProps {
  onSuccess: () => void
  subjects: { id: string, name: string }[]
}

export function QuestionForm({ onSuccess, subjects }: QuestionFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject_id: "",
    topic: "",
    difficulty: "easy",
    question_type: "mcq",
    question_text: "",
    marks: 1,
    correct_answer: ""
  })

  const [options, setOptions] = useState<string[]>(["", "", "", ""])

  const handleSubmit = async () => {
    if (!formData.subject_id || !formData.topic || !formData.question_text) {
      toast.error("Please fill all required fields")
      return
    }

    if (formData.question_type === "mcq" && options.some(o => !o.trim())) {
      toast.error("Please fill all options")
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        options: formData.question_type === "mcq" ? JSON.stringify(options) : null
      }

      const res = await apiClient("/exams/questions", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success("Question created successfully")
        setFormData({
          subject_id: "",
          topic: "",
          difficulty: "easy",
          question_type: "mcq",
          question_text: "",
          marks: 1,
          correct_answer: ""
        })
        setOptions(["", "", "", ""])
        onSuccess()
      } else {
        const error = await res.text()
        toast.error(error)
      }
    } catch (error) {
      toast.error("Failed to create question")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select 
            value={formData.subject_id} 
            onValueChange={v => setFormData({...formData, subject_id: v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Topic</Label>
          <Input 
            placeholder="e.g. Algebra" 
            value={formData.topic}
            onChange={e => setFormData({...formData, topic: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select 
            value={formData.difficulty} 
            onValueChange={v => setFormData({...formData, difficulty: v})}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Marks</Label>
          <Input 
            type="number"
            min={1}
            value={formData.marks}
            onChange={e => setFormData({...formData, marks: parseFloat(e.target.value)})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Question Type</Label>
        <Select 
          value={formData.question_type} 
          onValueChange={v => setFormData({...formData, question_type: v})}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
            <SelectItem value="descriptive">Descriptive</SelectItem>
            <SelectItem value="boolean">True/False</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Question Text</Label>
        <Textarea 
          placeholder="Enter your question here..." 
          className="min-h-[100px]"
          value={formData.question_text}
          onChange={e => setFormData({...formData, question_text: e.target.value})}
        />
      </div>

      {formData.question_type === "mcq" && (
        <div className="space-y-4">
          <Label>Options</Label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="flex-none w-8 flex items-center justify-center font-bold text-slate-500">
                {String.fromCharCode(65 + idx)}
              </span>
              <Input 
                value={opt}
                onChange={e => {
                  const newOpts = [...options]
                  newOpts[idx] = e.target.value
                  setOptions(newOpts)
                }}
                placeholder={`Option ${idx + 1}`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label>Correct Answer</Label>
        {formData.question_type === "mcq" ? (
          <Select 
            value={formData.correct_answer} 
            onValueChange={v => setFormData({...formData, correct_answer: v})}
          >
            <SelectTrigger><SelectValue placeholder="Select Correct Option" /></SelectTrigger>
            <SelectContent>
              {options.map((opt, idx) => (
                <SelectItem key={idx} value={opt || `opt-${idx}`}>
                  Option {String.fromCharCode(65 + idx)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input 
            placeholder="Enter correct answer / key keywords"
            value={formData.correct_answer}
            onChange={e => setFormData({...formData, correct_answer: e.target.value})}
          />
        )}
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
        <Save className="h-4 w-4 mr-2" />
        {loading ? "Saving..." : "Save Question"}
      </Button>
    </div>
  )
}
