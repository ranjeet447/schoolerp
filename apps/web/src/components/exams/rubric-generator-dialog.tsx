"use client"

import { useState } from "react"
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Sparkles, Loader2, Save, Wand2, Calculator, CheckCircle2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface RubricGeneratorDialogProps {
  subjectName: string
  subjectId: string
  examName: string
  examId: string
  maxMarks: number
}

interface RubricCriterion {
  criterion: string
  weight: number
  descriptors: {
    excellent: string
    good: string
    satisfactory: string
    needs_improvement: string
  }
}

export function RubricGeneratorDialog({ 
  subjectName, 
  subjectId, 
  examName, 
  examId,
  maxMarks 
}: RubricGeneratorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rubric, setRubric] = useState<RubricCriterion[]>([])
  const [saving, setSaving] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/ai/exams/rubrics/generate", {
        method: "POST",
        body: JSON.stringify({
          subject: subjectName,
          title: examName,
          grade: "Secondary", // Fallback or could be dynamic
          max_marks: maxMarks
        })
      })

      if (!res.ok) {
        throw new Error("Failed to generate rubric")
      }

      const data = await res.json()
      setRubric(data)
      toast.success("AI Rubric generated")
    } catch (err) {
      toast.error("Failed to generate rubric. Check AI settings.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
       // Note: This endpoint should be implemented or we can use a generic metadata endpoint
       // For now let's assume we can save it via specific metadata update if we have one
       // In the implementation plan, we just need to "Add Rubric Generator Dialog"
       // I'll assume we want to save it to the metadata column I added earlier.
       const res = await apiClient(`/admin/exams/${examId}/subjects/${subjectId}/metadata`, {
          method: "POST",
          body: JSON.stringify({
            rubric: rubric
          })
       })

       if(!res.ok) throw new Error("Failed to save")
       
       toast.success("Rubric saved to subject")
       setOpen(false)
    } catch (err) {
      toast.error("Failed to save rubric")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
          <Sparkles className="w-3.5 h-3.5" />
          AI Rubric
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wand2 className="w-6 h-6 text-indigo-500" />
            AI Rubric Generator
          </DialogTitle>
          <DialogDescription>
            Generate weighted grading criteria for <strong>{subjectName}</strong> in <strong>{examName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
               <Label className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Subject Context</Label>
               <p className="font-bold">{subjectName}</p>
             </div>
             <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
               <Label className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Max Marks</Label>
               <p className="font-bold flex items-center gap-2 text-indigo-600">
                 <Calculator className="w-4 h-4" />
                 {maxMarks}
               </p>
             </div>
          </div>

          {!rubric.length && !loading && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl bg-indigo-50/20 border-indigo-100">
              <Sparkles className="w-12 h-12 text-indigo-300 mb-4" />
              <p className="text-sm font-medium text-slate-500 mb-6 text-center max-w-sm">
                The AI will analyze your subject and exam constraints to build a structured rubric with balanced weights.
              </p>
              <Button onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-11 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95">
                Generate with AI
              </Button>
            </div>
          )}

          {loading && (
            <div className="space-y-4 p-4 border rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="font-bold italic animate-pulse">Designing rubric criteria...</span>
              </div>
              <div className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" />
              <div className="h-20 w-full rounded-lg bg-slate-100 animate-pulse" />
              <div className="h-20 w-full rounded-lg bg-slate-100 animate-pulse" />
            </div>
          )}

          {rubric.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">Proposed Grading Matrix</h3>
                <Button variant="ghost" size="sm" onClick={handleGenerate} className="text-xs font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50">
                  <Wand2 className="w-3.5 h-3.5 mr-2" />
                  Regenerate
                </Button>
              </div>
              
              <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm shadow-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-4">Criterion</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Excellent (100%)</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Satisfactory (50%)</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rubric.map((item, idx) => (
                      <TableRow key={idx} className="border-slate-50 transition-colors hover:bg-slate-50/30">
                        <TableCell className="font-bold align-top pt-4">{item.criterion}</TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[200px] align-top pt-4 py-4 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">{item.descriptors.excellent}</TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[200px] align-top pt-4 py-4 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">{item.descriptors.satisfactory}</TableCell>
                        <TableCell className="text-right align-top pt-4 pr-6">
                           <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black">{item.weight}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={() => setOpen(false)} className="font-bold border-slate-200">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-lg shadow-emerald-100">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Apply Rubric to Subject
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
