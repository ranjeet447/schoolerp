"use client"

import React, { useEffect, useState, useRef } from "react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Search,
  User,
  CreditCard,
  Banknote,
  CheckCircle,
  FileText,
  Loader2,
  Printer,
  ShieldAlert,
  TicketPercent,
  History
} from "lucide-react"
import { 
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@schoolerp/ui"

type Student = {
  id: string
  full_name: string
  admission_no: string
  class_name?: string
  section_name?: string
}

type FeeItem = {
  plan_id: string
  head_id: string
  head_name: string
  amount: number
  paid_amount: number
  due_date: string
  info?: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function FeeCounterPage() {
  const [search, setSearch] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  const [feeSummary, setFeeSummary] = useState<FeeItem[]>([])
  const [loadingFees, setLoadingFees] = useState(false)
  
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({})
  const [paymentMode, setPaymentMode] = useState("cash")
  const [processing, setProcessing] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Modals
  const [waiverModalOpen, setWaiverModalOpen] = useState(false)
  const [waiverItem, setWaiverItem] = useState<FeeItem | null>(null)
  const [waiverAmount, setWaiverAmount] = useState("")
  const [waiverReason, setWaiverReason] = useState("")

  useEffect(() => {
    // Focus search on mount for fast entry
    searchInputRef.current?.focus()
  }, [])

  // Lightning Fast Search
  useEffect(() => {
    if (search.length < 3) {
      setStudents([])
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await apiClient(`/admin/students?limit=10&search=${search}`)
        if (res.ok) {
          const data = await res.json()
          setStudents(data.data || data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student)
    setStudents([])
    setSearch("")
    setLoadingFees(true)
    setPaymentAmounts({})
    try {
      const res = await apiClient(`/admin/fees/students/${student.id}/summary`)
      if (res.ok) {
        const data = await res.json()
        setFeeSummary(data || [])
        // Auto-fill amounts for unpaid items
        const initialAmounts: Record<string, number> = {}
        data.forEach((item: FeeItem) => {
          const outstanding = item.amount - (item.paid_amount || 0)
          if (outstanding > 0) {
            initialAmounts[item.head_id] = outstanding
          }
        })
        setPaymentAmounts(initialAmounts)
      }
    } catch (err) {
      toast.error("Failed to fetch dues")
    } finally {
      setLoadingFees(false)
    }
  }

  const handleAmountChange = (headId: string, val: string) => {
    const num = parseInt(val) || 0
    setPaymentAmounts(prev => ({ ...prev, [headId]: num }))
  }

  const totalPaying = Object.values(paymentAmounts).reduce((a, b) => a + b, 0)
  const totalDues = feeSummary.reduce((a, b) => a + Math.max(0, b.amount - (b.paid_amount || 0)), 0)

  const handleCollect = async () => {
    if (!selectedStudent || totalPaying <= 0) return
    setProcessing(true)
    try {
      const items = Object.entries(paymentAmounts)
        .filter(([_, amt]) => amt > 0)
        .map(([headId, amount]) => ({ fee_head_id: headId, amount }))

      const payload = {
        student_id: selectedStudent.id,
        amount: totalPaying,
        mode: paymentMode,
        transaction_ref: "",
        items
      }

      const res = await apiClient("/admin/payments/offline", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Payment failed")
      
      toast.success("Fee collected successfully!")
      // Refresh
      selectStudent(selectedStudent)
    } catch (err) {
      toast.error("Failed to process payment")
    } finally {
      setProcessing(false)
    }
  }

  const handleWaiverRequest = async () => {
    if (!selectedStudent || !waiverItem) return
    try {
      const payload = {
        student_id: selectedStudent.id,
        fee_plan_item_id: waiverItem.plan_id,
        amount_waived: parseInt(waiverAmount),
        reason: waiverReason
      }
      const res = await apiClient("/admin/finance/waivers", {
        method: "POST",
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Waiver requested and sent for approval")
      setWaiverModalOpen(false)
      setWaiverAmount("")
      setWaiverReason("")
    } catch {
      toast.error("Could not request waiver")
    }
  }

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Fee Counter Mode</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Lightning fast search, collect, and print.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="hidden sm:flex border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10">
             <History className="h-4 w-4 mr-2" />
             Pending Approvals
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Panel: Search & Summary */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Search Bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-3.5 h-6 w-6 text-muted-foreground" />
            <Input 
              ref={searchInputRef}
              placeholder="Start typing student name or admission no..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 text-lg font-semibold rounded-2xl border-2 tracking-wide shadow-sm"
              autoComplete="off"
            />
            {searching && <Loader2 className="absolute right-4 top-4 h-6 w-6 animate-spin text-muted-foreground" />}
            
            {/* Search Results Dropdown */}
            {students.length > 0 && (
              <div className="absolute top-16 left-0 right-0 bg-card border shadow-xl rounded-2xl overflow-hidden z-50">
                {students.map(s => (
                  <div 
                    key={s.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer flex justify-between items-center border-b last:border-0"
                    onClick={() => selectStudent(s)}
                  >
                    <div>
                      <div className="font-bold text-lg">{s.full_name}</div>
                      <div className="text-sm font-medium text-muted-foreground">{s.admission_no} • {s.class_name} {s.section_name}</div>
                    </div>
                    <Button variant="ghost" size="sm">Select</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Banner */}
          {selectedStudent && (
             <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
                    {selectedStudent.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudent.full_name}</h2>
                    <p className="text-muted-foreground font-medium">{selectedStudent.admission_no} • {selectedStudent.class_name}</p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-sm font-bold text-muted-foreground">TOTAL OUTSTANDING</div>
                   <div className="text-2xl font-black text-destructive">{formatCurrency(totalDues)}</div>
                </div>
             </div>
          )}

          {/* Interactive Fee Ledger */}
          <div className="flex-1 overflow-auto border rounded-2xl bg-card shadow-sm h-full">
            {loadingFees ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Calculating dues...</p>
              </div>
            ) : !selectedStudent ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                <Search className="h-16 w-16 mb-4 opacity-50" />
                <p className="font-semibold text-lg">Search a student to begin</p>
              </div>
            ) : feeSummary.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                <p className="font-bold text-xl text-emerald-600">No Dues Found</p>
                <p>This student is fully paid up.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm border-b">
                  <tr className="text-muted-foreground font-bold">
                    <th className="py-4 px-4">Fee Head</th>
                    <th className="py-4 px-4">Due Date</th>
                    <th className="py-4 px-4 text-right">Balance</th>
                    <th className="py-4 px-4 text-right w-32">Paying Now</th>
                    <th className="py-4 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {feeSummary.map((item, idx) => {
                    const outstanding = Math.max(0, item.amount - (item.paid_amount || 0))
                    const isPaid = outstanding === 0
                    const isLate = new Date(item.due_date) < new Date() && !isPaid
                    
                    return (
                      <tr key={`${item.head_id}-${idx}`} className="hover:bg-muted/30 group">
                        <td className="py-4 px-4">
                          <div className="font-bold text-base">{item.head_name}</div>
                          {isLate && <div className="text-xs font-bold text-destructive flex items-center mt-1"><ShieldAlert className="h-3 w-3 mr-1"/> Overdue</div>}
                        </td>
                        <td className="py-4 px-4 font-medium text-muted-foreground">
                          {new Date(item.due_date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right font-black text-lg">
                          {isPaid ? (
                             <span className="text-emerald-500">Paid</span>
                          ) : (
                             formatCurrency(outstanding)
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                           {!isPaid && (
                             <Input
                               type="number"
                               min="0"
                               max={outstanding}
                               value={paymentAmounts[item.head_id] !== undefined ? paymentAmounts[item.head_id] : ""}
                               onChange={(e) => handleAmountChange(item.head_id, e.target.value)}
                               className="h-10 text-right font-bold text-lg bg-background border-2 focus-visible:ring-primary"
                             />
                           )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {!isPaid && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Request Waiver/Concession"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setWaiverItem(item);
                                setWaiverModalOpen(true);
                              }}
                            >
                              <TicketPercent className="h-4 w-4 text-amber-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Panel: Checkout / Cart */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col border-none shadow-xl bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6 flex flex-col h-full">
              <h3 className="text-2xl font-black text-foreground mb-6 flex items-center">
                <Banknote className="h-6 w-6 mr-3 text-emerald-500" />
                Checkout
              </h3>
              
              <div className="flex-1 space-y-6">
                <div className="space-y-2 p-6 bg-background rounded-2xl border-2 border-primary/10 text-center shadow-inner">
                  <Label className="text-muted-foreground text-sm font-bold tracking-widest uppercase">Collection Amount</Label>
                  <div className="text-5xl font-black text-primary tracking-tighter">
                    {formatCurrency(totalPaying)}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-bold text-foreground">Payment Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                     {["cash", "upi", "bank_transfer", "cheque"].map(mode => (
                       <Button 
                         key={mode}
                         variant={paymentMode === mode ? "default" : "outline"}
                         className={`h-12 border-2 ${paymentMode === mode ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/50'}`}
                         onClick={() => setPaymentMode(mode)}
                       >
                         {mode === "cash" && <Banknote className="h-4 w-4 mr-2" />}
                         {mode === "upi" && <span className="font-bold mr-2 text-primary">UPI</span>}
                         {mode === "bank_transfer" && <CreditCard className="h-4 w-4 mr-2" />}
                         {mode === "cheque" && <FileText className="h-4 w-4 mr-2" />}
                         {mode.replace("_", " ")}
                       </Button>
                     ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-3 pt-6 border-t border-border/50">
                <Button 
                  className="w-full h-14 text-lg font-black tracking-wide shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  onClick={handleCollect}
                  disabled={totalPaying <= 0 || processing}
                >
                  {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Collect & Print Receipt"}
                </Button>
                <Button variant="ghost" className="w-full h-12 font-bold text-muted-foreground hover:text-foreground">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Waiver Request Modal */}
      <Dialog open={waiverModalOpen} onOpenChange={setWaiverModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Concession / Late Waiver</DialogTitle>
            <DialogDescription>
              Submit a request for principal approval to waive late fees or apply a special concession on <span className="font-bold text-foreground">{waiverItem?.head_name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount to Waive (₹)</Label>
              <Input 
                type="number" 
                value={waiverAmount} 
                onChange={e => setWaiverAmount(e.target.value)} 
                placeholder="0"
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for Request</Label>
              <Input 
                value={waiverReason} 
                onChange={e => setWaiverReason(e.target.value)} 
                placeholder="E.g. Medical emergency, financial hardship..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaiverModalOpen(false)}>Cancel</Button>
            <Button onClick={handleWaiverRequest} className="bg-amber-600 hover:bg-amber-700 text-white">Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
