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
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Process monthly salaries and generate payslips.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Start New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
                <Button onClick={handleCreateRun} className="w-full">
                    Create Draft
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
             <Card className="border-none shadow-sm p-12 text-center text-muted-foreground font-medium">Loading payroll history...</Card>
        ) : runs.length === 0 ? (
             <Card className="border-none shadow-sm p-12 text-center bg-muted/20 border-dashed flex flex-col items-center">
               <Banknote className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
               <p className="font-semibold text-foreground">No payroll runs found.</p>
             </Card>
        ) : (
             <Card className="border-none shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Period</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Created On</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {runs.map(run => (
                      <tr key={run.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                            <span className="font-bold text-lg text-foreground">{getMonthName(run.month)} {run.year}</span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-medium">
                            {new Date(run.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                            <Badge variant="outline" className={
                                run.status === 'completed' ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400' :
                                run.status === 'processing' ? 'text-amber-600 border-amber-500/20 bg-amber-500/10 dark:text-amber-400' :
                                'text-muted-foreground'
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
                                >
                                    {processingId === run.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                                    Run Payroll
                                </Button>
                            )}
                            {run.status === 'completed' && (
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                                    <FileText className="h-4 w-4 mr-2" /> View Payslips
                                </Button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
             </Card>
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
