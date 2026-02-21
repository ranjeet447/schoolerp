"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"

interface Remark {
  id: string
  student_id: string
  category: string
  remark_text: string
  requires_ack: boolean
  is_acknowledged: boolean
  posted_by_name: string
  created_at: string
}

interface Child {
  id: string
  full_name: string
}

export default function ParentDiaryPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>("")
  const [remarks, setRemarks] = useState<Remark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [ackLoading, setAckLoading] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const childrenRes = await apiClient("/parent/me/children")
      if (!childrenRes.ok) throw new Error("Failed to load children")
      
      const childrenData = await childrenRes.json()
      const childArray = Array.isArray(childrenData) ? childrenData : childrenData.data || []
      setChildren(childArray)

      if (childArray.length > 0) {
        setSelectedChildId(childArray[0].id)
        await fetchRemarks(childArray[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchRemarks = async (childId: string) => {
    try {
      const res = await apiClient(`/admin/students/${childId}/remarks`)
      if (!res.ok) throw new Error("Failed to load remarks")
      const data = await res.json()
      setRemarks(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const acknowledgeRemark = async (remarkId: string) => {
    setAckLoading(remarkId)
    try {
      const res = await apiClient(`/admin/remarks/${remarkId}/acknowledge`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to acknowledge remark")
      
      // Update local state
      setRemarks(prev => 
        prev.map(r => r.id === remarkId ? { ...r, is_acknowledged: true } : r)
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to acknowledge")
    } finally {
      setAckLoading(null)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      fetchRemarks(selectedChildId)
    }
  }, [selectedChildId])

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Diary</h1>
        <p className="text-slate-500">View teacher remarks and observations for your children.</p>
        
        {children.length > 1 && (
          <div className="flex gap-2 mt-6">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChildId === child.id ? "default" : "outline"}
                onClick={() => setSelectedChildId(child.id)}
                className="rounded-xl px-6 h-10 uppercase text-[10px] font-black tracking-widest transition-all"
              >
                {child.full_name}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {remarks.length === 0 ? (
          <Card className="border-dashed border-2 py-12 text-center text-slate-400 bg-slate-50/50 rounded-[2rem]">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold">No remarks recorded yet.</p>
          </Card>
        ) : (
          remarks.map((remark) => (
            <Card key={remark.id} className="bg-white border-rose-100 rounded-[2rem] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="rounded-full bg-rose-50 text-rose-600 border-rose-100 px-3 py-1 uppercase text-[10px] font-black tracking-widest">
                        {remark.category}
                      </Badge>
                      <span className="text-[10px] text-slate-400 uppercase font-black flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {remark.created_at ? format(new Date(remark.created_at), "PPP p") : ""}
                      </span>
                    </div>

                    <p className="text-lg font-medium text-slate-800 leading-relaxed">
                      "{remark.remark_text}"
                    </p>

                    <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {remark.posted_by_name?.slice(0, 1) || "T"}
                      </div>
                      <span className="text-xs font-bold text-slate-500">Posted by {remark.posted_by_name || "Teacher"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-end gap-3 min-w-[150px]">
                    {remark.requires_ack && (
                      remark.is_acknowledged ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Acknowledged</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => acknowledgeRemark(remark.id)}
                          disabled={ackLoading === remark.id}
                          className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-12 uppercase text-xs font-black tracking-widest shadow-lg shadow-rose-500/20"
                        >
                          {ackLoading === remark.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Acknowledge"
                          )}
                        </Button>
                      )
                    )}
                    {!remark.requires_ack && (
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest italic outline px-2 py-1 rounded-lg">Read Only</span>
                    )}
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
