"use client"

import { useEffect, useState } from "react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Badge,
  Button,
  Input,
  Textarea,
  Label,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@schoolerp/ui"
import { 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  MessageSquare, 
  FileText,
  Loader2,
  ChevronRight
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function ParentHomeworkPage() {
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildID, setSelectedChildID] = useState("")
  const [homework, setHomework] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Submission State
  const [selectedHw, setSelectedHw] = useState<any | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [remarks, setRemarks] = useState("")

  const fetchChildren = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient("/parent/me/children")
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load children")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []
      setChildren(data)
      if (data.length > 0) {
        setSelectedChildID(String(data[0].id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load children")
      setChildren([])
    } finally {
      setLoading(false)
    }
  }

  const fetchHomework = async (childID: string) => {
    if (!childID) {
      setHomework([])
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await apiClient(`/parent/homework?student_id=${encodeURIComponent(childID)}`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load homework")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []
      setHomework(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load homework")
      setHomework([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChildID) {
      fetchHomework(selectedChildID)
    }
  }, [selectedChildID])

  const handleSubmit = async () => {
    if (!selectedHw || !selectedChildID) return
    setSubmitting(true)
    try {
      const res = await apiClient(`/parent/homework/${selectedHw.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          student_id: selectedChildID,
          attachment_url: attachmentUrl,
          remarks: remarks
        })
      })
      if (!res.ok) {
        throw new Error("Failed to submit homework")
      }
      toast.success("Homework submitted successfully!")
      setSelectedHw(null)
      fetchHomework(selectedChildID)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Homework</h1>
          <p className="text-slate-500 text-sm mt-1">Keep track of upcoming assignments and submission status.</p>
        </div>

        <div className="flex items-center gap-3 bg-muted/30 p-1 rounded-lg border w-fit">
          <span className="text-[10px] uppercase font-bold text-muted-foreground px-2">Student Profile:</span>
          <Select value={selectedChildID} onValueChange={setSelectedChildID}>
            <SelectTrigger className="w-[200px] h-8 text-xs border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={String(child.id)} value={String(child.id)}>
                  {child.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
           <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fetching Assignments...</p>
        </div>
      ) : homework.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 border-2 border-dashed rounded-2xl">
          <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
             <BookOpen className="h-8 w-8 text-muted-foreground opacity-20" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
            No homework has been assigned to your child's section at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {homework.map((item) => (
            <Card key={String(item.id)} className="group border-slate-200 hover:border-primary transition-all overflow-hidden flex flex-col">
              <CardHeader className="pb-3 bg-slate-50/50 border-b space-y-3">
                <div className="flex justify-between items-start">
                   <Badge variant="secondary" className="bg-white border-slate-200 text-[10px] uppercase tracking-wide">
                     {String(item.subject_name || 'General')}
                   </Badge>
                   <div className="flex flex-col items-end">
                      <Badge 
                        variant={item.submission_status === 'checked' ? 'outline' : (item.submission_status === 'pending' ? 'secondary' : 'default')}
                        className={`text-[9px] px-2 py-0.5 rounded-full ${
                          item.submission_status === 'checked' ? 'bg-green-50 text-green-700 border-green-200' :
                          item.submission_status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.submission_status?.toUpperCase() || 'NOT SUBMITTED'}
                      </Badge>
                   </div>
                </div>
                <CardTitle className="text-base font-bold leading-tight line-clamp-1">{String(item.title || "Untitled")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {String(item.description || "Refer to class notes for details.")}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                   {item.teacher_feedback && (
                     <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1.5">
                           <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                           <span className="text-[10px] font-bold text-blue-800 uppercase tracking-tighter">Teacher Feedback</span>
                        </div>
                        <p className="text-[11px] text-blue-700 italic leading-relaxed">"{item.teacher_feedback}"</p>
                     </div>
                   )}

                   <Button 
                     variant={item.submission_status ? "outline" : "default"} 
                     size="sm" 
                     className="w-full h-9 rounded-lg gap-2 text-xs font-semibold"
                     onClick={() => {
                        setSelectedHw(item)
                        setAttachmentUrl(item.attachment_url || "")
                        setRemarks(item.remarks || "")
                     }}
                   >
                     {item.submission_status ? (
                       <><CheckCircle2 className="h-4 w-4" /> Edit Submission</>
                     ) : (
                       <><Upload className="h-4 w-4" /> Turn In Work</>
                     )}
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Dialog */}
      <Dialog open={!!selectedHw} onOpenChange={(open) => !open && setSelectedHw(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Homework Submission</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Submit work for <span className="font-bold text-foreground">{selectedHw?.title}</span>
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Work URL / Link</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Link to Google Drive / PDF..." 
                    value={attachmentUrl} 
                    onChange={e => setAttachmentUrl(e.target.value)}
                    className="pl-9 h-10 text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">Provide a link to your scanned document or digital work.</p>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Remarks (Optional)</Label>
                <Textarea 
                  placeholder="Anything you'd like the teacher to know?" 
                  value={remarks} 
                  onChange={e => setRemarks(e.target.value)}
                  className="min-h-[100px] text-sm"
                />
             </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-xs" onClick={() => setSelectedHw(null)}>Cancel</Button>
            <Button size="sm" className="text-xs gap-2" disabled={submitting} onClick={handleSubmit}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Submit Now</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
