"use client"

import React, { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Search,
  User,
  CreditCard,
  Banknote,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
  ChevronRight
} from "lucide-react"
import { 
  Button,
  Input,
  Label,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@schoolerp/ui"
import { cn } from "@/lib/utils"

type Student = {
  id: string
  full_name: string
  admission_no: string
  class_name?: string
  section_name?: string
  status: string
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

type ReceiptItem = {
  fee_head_id: string
  amount: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function FeeCollectionPage() {
  // Search State
  const [query, setQuery] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [showSearch, setShowSearch] = useState(true)

  // Fee State
  const [feeSummary, setFeeSummary] = useState<FeeItem[]>([])
  const [loadingFees, setLoadingFees] = useState(false)
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({})

  // Payment State
  const [paymentMode, setPaymentMode] = useState("cash")
  const [refNo, setRefNo] = useState("")
  const [processing, setProcessing] = useState(false)

  // Load Students on Mount
  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true)
      try {
        const res = await apiClient("/admin/students?limit=100")
        if (res.ok) {
          const data = await res.json()
          setStudents(Array.isArray(data) ? data : data.data || [])
        }
      } catch (err) {
        toast.error("Failed to load students")
      } finally {
        setLoadingStudents(false)
      }
    }
    loadStudents()
  }, [])

  // Filter Students
  const filteredStudents = students.filter(s => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      s.full_name.toLowerCase().includes(q) ||
      (s.admission_no && s.admission_no.toLowerCase().includes(q))
    )
  })

  // Select Student
  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student)
    setShowSearch(false)
    setLoadingFees(true)
    setPaymentAmounts({})
    try {
      const res = await apiClient(`/admin/fees/students/${student.id}/summary`)
      if (res.ok) {
        const data = await res.json()
        setFeeSummary(data || [])
      } else {
        toast.error("Failed to fetch fee summary")
      }
    } catch (err) {
      toast.error("Failed to fetch fee summary")
    } finally {
      setLoadingFees(false)
    }
  }

  // Handle Input Change
  const handleAmountChange = (headId: string, val: string) => {
    const num = parseInt(val) || 0
    setPaymentAmounts(prev => ({
      ...prev,
      [headId]: num
    }))
  }

  // Calculate Totals
  const totalPaying = Object.values(paymentAmounts).reduce((a, b) => a + b, 0)

  // Submit Payment
  const handleCollectFee = async () => {
    if (!selectedStudent) return
    if (totalPaying <= 0) {
      toast.error("Please enter an amount to collect")
      return
    }

    setProcessing(true)
    try {
      // Construct Receipt Items
      const items: ReceiptItem[] = Object.entries(paymentAmounts)
        .filter(([_, amount]) => amount > 0)
        .map(([headId, amount]) => ({
          fee_head_id: headId,
          amount: amount
        }))

      const payload = {
        student_id: selectedStudent.id,
        amount: totalPaying,
        mode: paymentMode,
        transaction_ref: refNo,
        items: items
      }

      const res = await apiClient("/admin/payments/offline", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Payment failed")
      
      const receipt = await res.json()
      toast.success("Fee collected successfully!")
      
      // Reset or redirect? 
      // For now, reload fee summary
      handleSelectStudent(selectedStudent)
      setRefNo("")

      // Optional: Prompt to download receipt
      // We can use the receipt ID to trigger download
    } catch (err) {
      toast.error("Failed to collect fee")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fee Collection</h1>
          <p className="text-slate-400 font-medium">Collect fees and generate receipts.</p>
        </div>
      </div>

      {/* Student Search Section */}
      {showSearch ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-400" />
            Search Student
          </h2>
          <Command className="bg-slate-950/50 border border-white/10 rounded-xl overflow-hidden">
            <CommandInput 
              placeholder="Search by name or admission no..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-white placeholder:text-slate-500"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No students found.</CommandEmpty>
              <CommandGroup heading="Students">
                {filteredStudents.map(student => (
                  <CommandItem
                    key={student.id}
                    value={student.id}
                    onSelect={() => handleSelectStudent(student)}
                    className="flex justify-between items-center p-3 hover:bg-white/5 cursor-pointer text-slate-300 hover:text-white"
                  >
                    <div>
                      <div className="font-bold">{student.full_name}</div>
                      <div className="text-xs text-slate-500">{student.admission_no}</div>
                    </div>
                    {student.class_name && (
                      <div className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded">
                        {student.class_name} {student.section_name}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      ) : (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{selectedStudent?.full_name}</h3>
              <p className="text-slate-400 text-sm">{selectedStudent?.admission_no}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => { setSelectedStudent(null); setShowSearch(true); setFeeSummary([]) }}
            className="text-slate-400 hover:text-white"
          >
            Change Student
          </Button>
        </div>
      )}

      {selectedStudent && !showSearch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fee Summary Table */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              Fee Structure
            </h2>

            {loadingFees ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading details...
              </div>
            ) : feeSummary.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No fee plans assigned.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-sm">
                      <th className="py-3 px-2 font-medium">Head</th>
                      <th className="py-3 px-2 font-medium text-right">Plan Amt</th>
                      <th className="py-3 px-2 font-medium text-right">Paid</th>
                      <th className="py-3 px-2 font-medium text-right text-red-400">Balance</th>
                      <th className="py-3 px-2 font-medium text-right w-32">Pay Now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {feeSummary.map((item, idx) => {
                      const outstanding = Math.max(0, item.amount - (item.paid_amount || 0))
                      const isPaid = outstanding === 0
                      
                      return (
                        <tr key={`${item.head_id}-${idx}`} className="group hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2 text-slate-300 font-medium">
                            {item.head_name}
                            <div className="text-xs text-slate-500">{item.info}</div>
                          </td>
                          <td className="py-3 px-2 text-right text-slate-400">{formatCurrency(item.amount)}</td>
                          <td className="py-3 px-2 text-right text-green-400/80">{formatCurrency(item.paid_amount || 0)}</td>
                          <td className="py-3 px-2 text-right font-bold text-red-400">{formatCurrency(outstanding)}</td>
                          <td className="py-3 px-2 text-right">
                             {!isPaid ? (
                               <Input
                                 type="number"
                                 min="0"
                                 max={outstanding}
                                 placeholder="0"
                                 value={paymentAmounts[item.head_id] || ""}
                                 onChange={(e) => handleAmountChange(item.head_id, e.target.value)}
                                 className="h-9 w-full text-right bg-slate-950/50 border-white/10 focus:border-indigo-500"
                               />
                             ) : (
                               <span className="flex items-center justify-end text-green-500 text-sm font-bold">
                                 <CheckCircle className="h-4 w-4 mr-1" /> Paid
                               </span>
                             )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Widget */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-400" />
                Payment Details
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Total Paying Amount</Label>
                  <div className="text-4xl font-black text-white">{formatCurrency(totalPaying)}</div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="space-y-2">
                    <Label htmlFor="mode">Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI / Online</SelectItem>
                        <SelectItem value="cheque">Cheque / DD</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref">Reference No. (Optional)</Label>
                    <Input 
                      id="ref" 
                      placeholder="e.g. UTR Number, Cheque No" 
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full h-12 text-lg font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                  onClick={handleCollectFee}
                  disabled={totalPaying <= 0 || processing}
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin" /> 
                  ) : (
                    <>Collect {formatCurrency(totalPaying)}</>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
               <div className="flex gap-3">
                 <AlertCircle className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                 <p className="text-sm text-indigo-200">
                   Note: Receipts are generated automatically upon successful payment collection.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
