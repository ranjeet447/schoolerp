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
  Badge,
  Label
} from "@schoolerp/ui"
import { Plus, Play, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"

type PayrollRun = {
  id: string
  month: number
  year: number
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
}

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // New Run State
  const [newRun, setNewRun] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  useEffect(() => {
    fetchRuns()
  }, [])

  const fetchRuns = async () => {
    setLoading(true)
    const res = await apiClient("/hrms/payroll-runs?limit=12")
    if (res.ok) {
      setRuns(await res.json())
    }
    setLoading(false)
  }

  const handleCreateRun = async () => {
    try {
      const res = await apiClient("/hrms/payroll-runs", {
        method: "POST",
        body: JSON.stringify(newRun)
      })

      if (res.ok) {
        toast.success("Payroll Cycle Created")
        setOpen(false)
        fetchRuns()
      } else {
        const error = await res.text()
        toast.error(error)
      }
    } catch (error) {
      toast.error("Failed to create run")
    }
  }

  const handleExecute = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await apiClient(`/hrms/payroll-runs/${id}/execute`, {
        method: "POST"
      })

      if (res.ok) {
        toast.success("Payroll Execution Started")
        // Poll for status update or just refresh
        fetchRuns()
      } else {
        const error = await res.text()
        toast.error(error)
      }
    } catch (error) {
      toast.error("Execution failed")
    } finally {
      setProcessingId(null)
    }
  }

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payroll Management</h1>
          <p className="text-slate-400 font-medium">Process monthly salaries and generate payslips.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-500">
                <Plus className="h-4 w-4 mr-2" /> Start New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Start Payroll Cycle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Month</Label>
                    <Select 
                        value={newRun.month.toString()} 
                        onValueChange={v => setNewRun({...newRun, month: parseInt(v)})}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Year</Label>
                    <Input 
                        type="number" 
                        value={newRun.year} 
                        onChange={e => setNewRun({...newRun, year: parseInt(e.target.value)})}
                    />
                </div>
                <Button onClick={handleCreateRun} className="w-full bg-indigo-600 hover:bg-indigo-500">
                    Create Draft
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
             <div className="text-center py-20 text-slate-500">Loading payroll history...</div>
        ) : runs.length === 0 ? (
             <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
               <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50 text-indigo-400" />
               <p>No payroll runs found.</p>
             </div>
        ) : (
             <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Period</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Created On</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {runs.map(run => (
                      <tr key={run.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                            <span className="font-bold text-lg text-white">{getMonthName(run.month)} {run.year}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                            {new Date(run.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                            <Badge variant="outline" className={
                                run.status === 'completed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                run.status === 'processing' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                'text-slate-400 border-slate-500/20'
                            }>
                                {run.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                {run.status.toUpperCase()}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {run.status === 'pending' && (
                                <Button 
                                    size="sm" 
                                    onClick={() => handleExecute(run.id)}
                                    disabled={processingId === run.id}
                                    className="bg-emerald-600 hover:bg-emerald-500"
                                >
                                    {processingId === run.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                                    Run Payroll
                                </Button>
                            )}
                            {run.status === 'completed' && (
                                <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-white">
                                    <FileText className="h-4 w-4 mr-2" /> View Payslips
                                </Button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
        )}
      </div>
    </div>
  )
}

function Banknote(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="12" x="2" y="6" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    )
}
