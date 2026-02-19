"use client"

import { useState, useEffect } from "react"
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
  Label,
  Badge,
  Separator
} from "@schoolerp/ui"
import { Plus, Trash2, Wand2, ArrowLeft, FileText, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Blueprint = {
  topic: string
  difficulty: string
  type: string
  count: number
}

type Subject = {
  id: string
  name: string
}

export default function GeneratePaperPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [setName, setSetName] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])

  // New Blueprint Item State
  const [newItem, setNewItem] = useState<Blueprint>({
    topic: "",
    difficulty: "easy",
    type: "mcq",
    count: 1
  })

  useEffect(() => {
    const fetchSubjects = async () => {
      const res = await apiClient("/academics/subjects")
      if (res.ok) setSubjects(await res.json())
    }
    fetchSubjects()
  }, [])

  const addBlueprint = () => {
    if (!newItem.topic) return toast.error("Topic is required")
    setBlueprints([...blueprints, newItem])
    setNewItem({ ...newItem, count: 1 }) // Reset count, keep others for rapid entry
  }

  const removeBlueprint = (index: number) => {
    setBlueprints(blueprints.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (!selectedSubject || !setName || blueprints.length === 0) {
      toast.error("Please fill all required fields")
      return
    }

    setLoading(true)
    try {
      const payload = {
        subject_id: selectedSubject,
        set_name: setName,
        academic_year_id: "", // Optional or fetch current
        blueprints: blueprints
      }

      const res = await apiClient("/exams/papers/generate", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success("Paper Generated Successfully!")
        const paper = await res.json()
        // TODO: Redirect to paper view or show preview
        router.push("/admin/academics/question-bank") 
      } else {
        const error = await res.text()
        toast.error("Generation Failed: " + error)
      }
    } catch (err) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/academics/question-bank">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">AI Paper Generator</h1>
          <p className="text-slate-400 font-medium">Define structure and let AI pick the best questions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="md:col-span-2 space-y-6">
           <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
             <CardHeader>
               <CardTitle>Paper Details</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Set Name / Title</Label>
                    <Input 
                      placeholder="e.g. Mid-Term Set A" 
                      value={setName} 
                      onChange={e => setSetName(e.target.value)} 
                    />
                  </div>
                </div>
             </CardContent>
           </Card>

           <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
             <CardHeader>
               <CardTitle>Blueprint Configuration</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2 space-y-2">
                        <Label>Topic</Label>
                        <Input 
                          placeholder="e.g. Algebra" 
                          value={newItem.topic} 
                          onChange={e => setNewItem({...newItem, topic: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <Select value={newItem.difficulty} onValueChange={v => setNewItem({...newItem, difficulty: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Count</Label>
                        <Input 
                          type="number" min={1} 
                          value={newItem.count} 
                          onChange={e => setNewItem({...newItem, count: parseInt(e.target.value)})} 
                        />
                    </div>
                    <Button onClick={addBlueprint} className="bg-indigo-600 hover:bg-indigo-500">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Added Rules</h4>
                    {blueprints.length === 0 && (
                        <p className="text-center py-8 text-slate-500 italic">No rules added yet.</p>
                    )}
                    {blueprints.map((bp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-slate-700">{bp.count}x</Badge>
                                <span className="font-medium text-slate-200">{bp.topic}</span>
                                <Badge variant="secondary" className="capitalize">{bp.difficulty}</Badge>
                                <Badge variant="secondary" className="capitalize">{bp.type}</Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeBlueprint(idx)} className="text-rose-400 hover:bg-rose-950/30">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Summary Panel */}
        <div className="space-y-6">
           <Card className="bg-indigo-600 border-indigo-500/50 rounded-3xl text-white">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Wand2 className="h-5 w-5" /> Generation Summary
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex justify-between items-center py-2 border-b border-white/10">
                 <span className="text-indigo-100">Total Questions</span>
                 <span className="font-bold text-2xl">{blueprints.reduce((acc, curr) => acc + curr.count, 0)}</span>
               </div>
               <div className="space-y-2 text-sm text-indigo-100">
                 <p className="opacity-80">
                   The AI will attempt to find unique questions matching your criteria from the database.
                 </p>
               </div>
               <Button 
                onClick={handleGenerate} 
                disabled={loading || blueprints.length === 0}
                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold h-12 rounded-xl"
               >
                 {loading ? "Generating..." : "Generate Paper"}
               </Button>
             </CardContent>
           </Card>

           <div className="bg-slate-900/30 p-4 rounded-2xl border border-white/5 text-sm text-slate-500 space-y-2">
             <div className="flex gap-2">
               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
               <p>Questions are randomized.</p>
             </div>
             <div className="flex gap-2">
               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
               <p>Marks are automatically tallied.</p>
             </div>
             <div className="flex gap-2">
               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
               <p>Output includes answer key.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
