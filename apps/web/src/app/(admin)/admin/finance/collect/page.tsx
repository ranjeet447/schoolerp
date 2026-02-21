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
  Card,
  CardContent,
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

  // Debounced Search Logic
  useEffect(() => {
    if (query.length > 1) {
      const timer = setTimeout(async () => {
        setLoadingStudents(true)
        try {
          const res = await apiClient(`/admin/students?query=${encodeURIComponent(query)}&limit=10`)
          if (res.ok) {
            const data = await res.json()
            setStudents(Array.isArray(data) ? data : data.data || [])
          }
        } catch (err) {
          console.error("Failed to fetch students", err)
        } finally {
          setLoadingStudents(false)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setStudents([])
    }
  }, [query])

  // Filter Students - no longer needed with API search, but keeping structure for now
  const filteredStudents = students

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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Fee Collection</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Collect fees and generate receipts.</p>
        </div>
      </div>

      {/* Student Search Section */}
      {showSearch ? (
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Student
            </h2>
            <Command className="border rounded-xl overflow-hidden shadow-sm">
              <CommandInput 
                placeholder="Search by name or admission no..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>No students found.</CommandEmpty>
                <CommandGroup heading="Students">
                  {filteredStudents.map(student => (
                    <CommandItem
                      key={student.id}
                      value={student.id}
                      onSelect={() => handleSelectStudent(student)}
                      className="flex justify-between items-center p-3 cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{student.full_name}</div>
                        <div className="text-xs text-muted-foreground font-medium">{student.admission_no}</div>
                      </div>
                      {student.class_name && (
                        <div className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                          {student.class_name} {student.section_name}
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{selectedStudent?.full_name}</h3>
              <p className="text-muted-foreground text-sm font-medium">{selectedStudent?.admission_no}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => { setSelectedStudent(null); setShowSearch(true); setFeeSummary([]) }}
            className="w-full sm:w-auto"
          >
            Change Student
          </Button>
        </div>
      )}

      {selectedStudent && !showSearch && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Fee Summary Table */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Fee Structure
                </h2>

                {loadingFees ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading details...
                  </div>
                ) : feeSummary.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl font-medium">No fee plans assigned.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 border-y">
                        <tr className="text-muted-foreground font-semibold">
                          <th className="py-3 px-4">Head</th>
                          <th className="py-3 px-4 text-right">Plan Amt</th>
                          <th className="py-3 px-4 text-right">Paid</th>
                          <th className="py-3 px-4 text-right text-destructive">Balance</th>
                          <th className="py-3 px-4 text-right w-32">Pay Now</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {feeSummary.map((item, idx) => {
                          const outstanding = Math.max(0, item.amount - (item.paid_amount || 0))
                          const isPaid = outstanding === 0
                          
                          return (
                            <tr key={`${item.head_id}-${idx}`} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-foreground">{item.head_name}</div>
                                {item.info && <div className="text-xs text-muted-foreground mt-0.5">{item.info}</div>}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-muted-foreground">{formatCurrency(item.amount)}</td>
                              <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurrency(item.paid_amount || 0)}</td>
                              <td className="py-3 px-4 text-right font-bold text-destructive">{formatCurrency(outstanding)}</td>
                              <td className="py-3 px-4 text-right">
                                 {!isPaid ? (
                                   <Input
                                     type="number"
                                     min="0"
                                     max={outstanding}
                                     placeholder="0"
                                     value={paymentAmounts[item.head_id] || ""}
                                     onChange={(e) => handleAmountChange(item.head_id, e.target.value)}
                                     className="h-9 w-full text-right"
                                   />
                                 ) : (
                                   <span className="flex items-center justify-end text-emerald-600 text-sm font-bold">
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
              </CardContent>
            </Card>
          </div>

          {/* Payment Widget */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  Payment Details
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-1.5 p-4 bg-muted/20 border rounded-xl text-center">
                    <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Total Paying Amount</Label>
                    <div className="text-4xl font-black text-foreground">{formatCurrency(totalPaying)}</div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="space-y-2">
                      <Label htmlFor="mode">Payment Mode</Label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger>
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
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
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
              </CardContent>
            </Card>
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
               <div className="flex gap-3">
                 <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                 <p className="text-sm font-medium text-foreground">
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
