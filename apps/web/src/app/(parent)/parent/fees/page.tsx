"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Badge
} from "@schoolerp/ui"
import { 
  Receipt, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Download,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import Script from "next/script"

type FeeSummary = {
  student_id: string
  total_due: number
  total_paid: number
  balance: number
  next_due_date?: string
  heads: {
      head_name: string
      amount: number
      paid: number
      due: number
  }[]
}

type ReceiptRecord = {
    id: string
    receipt_number: string
    amount: number
    mode: string
    created_at: string
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function ParentFeesPage() {
  const [children, setChildren] = useState<{id: string, full_name: string, admission_number: string}[]>([])
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [summary, setSummary] = useState<FeeSummary | null>(null)
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChild) {
        fetchData(selectedChild)
    }
  }, [selectedChild])

  const fetchChildren = async () => {
      try {
          const res = await apiClient("/parent/me/children")
          if (res.ok) {
              const data = await res.json()
              setChildren(data)
              if (data.length > 0) {
                  setSelectedChild(data[0].id)
              }
          }
      } catch (err) {
          toast.error("Failed to load children")
      }
  }

  const fetchData = async (childId: string) => {
    setLoading(true)
    try {
        // Fetch Summary
        const sumRes = await apiClient(`/parent/children/${childId}/fees/summary`)
        if (sumRes.ok) setSummary(await sumRes.json())

        // Fetch Receipts
        const recRes = await apiClient(`/parent/children/${childId}/fees/receipts`)
        if (recRes.ok) setReceipts(await recRes.json())

    } catch (err) {
        toast.error("Failed to load fee data")
    } finally {
        setLoading(false)
    }
  }

  const downloadReceipt = async (receiptId: string) => {
    try {
      const res = await apiClient(`/v1/admin/receipts/${receiptId}/pdf`) // This might need parent specific route too if /admin is blocked
      if (!res.ok) throw new Error("Download failed")
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt_${receiptId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      toast.error("Failed to download receipt")
    }
  }

  const handlePayNow = async () => {
      if (!summary || summary.balance <= 0 || !selectedChild) return
      setProcessing(true)

      try {
          // 1. Create Order
          const orderRes = await apiClient("/v1/parent/payments/online", {
              method: "POST",
              body: JSON.stringify({
                  student_id: selectedChild,
                  amount: summary.balance
              })
          })
          
          if (!orderRes.ok) throw new Error("Failed to create order")
          const order = await orderRes.json()

          const keyRes = await apiClient("/v1/parent/fees/gateways?provider=razorpay")
          if (!keyRes.ok) {
              throw new Error("Payment gateway is not available for this account")
          }
          const gateway = await keyRes.json()
          const key = gateway?.api_key
          if (!key) {
              throw new Error("Gateway key is missing")
          }

          const selectedChildInfo = children.find((c) => c.id === selectedChild)

          const options = {
              key: key, 
              amount: order.amount,
              currency: order.currency,
              name: "School ERP",
              description: "Fee Payment",
              order_id: order.external_ref, // Use external_ref (rzp_order_id)
              handler: async function (response: any) {
                  toast.success("Payment Received! It will take a few minutes to verify.")
                  setTimeout(() => fetchData(selectedChild), 3000)
              },
              prefill: {
                  name: selectedChildInfo?.full_name || ""
              },
              theme: {
                  color: "#4f46e5"
              }
          }

          const rzp = new window.Razorpay(options)
          rzp.open()

      } catch (err) {
          toast.error("Payment initiation failed")
      } finally {
          setProcessing(false)
      }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val)

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Fee Center</h1>
            <p className="text-slate-500">Manage your child's school fees and view history.</p>
        </div>
        
        {/* Child Selector */}
        {children.length > 1 && (
            <div className="flex gap-2">
                {children.map(child => (
                    <Button 
                        key={child.id}
                        variant={selectedChild === child.id ? "default" : "outline"}
                        onClick={() => setSelectedChild(child.id)}
                        className={`rounded-xl ${selectedChild === child.id ? "bg-indigo-600 hover:bg-indigo-500" : ""}`}
                    >
                       {child.full_name}
                    </Button>
                ))}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none rounded-3xl shadow-xl">
            <CardContent className="pt-8 text-center space-y-2">
                <p className="text-indigo-200 font-bold uppercase tracking-widest text-sm">Total Outstanding</p>
                <h2 className="text-5xl font-black">{summary ? formatCurrency(summary.balance) : "..."}</h2>
                <div className="pt-6">
                    <Button 
                        size="lg" 
                        onClick={handlePayNow}
                        disabled={!summary || summary.balance <= 0 || processing}
                        className="w-full bg-white text-indigo-700 hover:bg-slate-100 font-bold text-lg h-14 rounded-xl shadow-lg"
                    >
                        {processing ? "Processing..." : "Pay Now"}
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="rounded-3xl border-slate-200 dark:border-white/10">
            <CardHeader>
                <CardTitle className="text-lg">Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <span className="text-slate-500 dark:text-slate-400">Next Due Date</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                        {summary?.next_due_date ? new Date(summary.next_due_date).toLocaleDateString() : "No Dues"}
                    </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <span className="text-slate-500 dark:text-slate-400">Last Payment</span>
                    <div className="text-right">
                        <span className="font-bold text-slate-800 dark:text-white">
                            {receipts.length > 0 ? formatCurrency(receipts[0].amount) : "-"}
                        </span>
                        <p className="text-xs text-slate-400">
                             {receipts.length > 0 ? new Date(receipts[0].created_at).toLocaleDateString() : ""}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="w-full bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl mb-6 grid grid-cols-2">
            <TabsTrigger value="breakdown" className="rounded-xl py-2.5">Fee Breakdown</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl py-2.5">History</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
            <Card className="rounded-3xl border-slate-200 dark:border-white/10">
                <CardContent className="pt-6 space-y-4">
                    {summary?.heads.map((head, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">{head.head_name}</h4>
                                <div className="flex gap-2 text-xs mt-1">
                                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-none">
                                        Paid: {formatCurrency(head.paid)}
                                    </Badge>
                                    {head.due > 0 && (
                                        <Badge variant="outline" className="bg-red-100 text-red-700 border-none">
                                            Due: {formatCurrency(head.due)}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                                {formatCurrency(head.amount)}
                            </span>
                        </div>
                    ))}
                    {(!summary || summary.heads.length === 0) && (
                        <p className="text-center py-10 text-slate-400">No fee records found.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="history">
            <Card className="rounded-3xl border-slate-200 dark:border-white/10">
                <CardContent className="pt-6 space-y-4">
                    {receipts.map(rec => (
                        <div key={rec.id} className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">Receipt #{rec.receipt_number}</h4>
                                    <p className="text-xs text-slate-500">{new Date(rec.created_at).toDateString()} • {rec.mode}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-800 dark:text-white">{formatCurrency(rec.amount)}</p>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => downloadReceipt(rec.id)}
                                    className="h-6 text-xs text-indigo-600 hover:text-indigo-700 px-0"
                                >
                                    <Download className="h-3 w-3 mr-1" /> Download
                                </Button>
                            </div>
                        </div>
                    ))}
                     {receipts.length === 0 && (
                        <p className="text-center py-10 text-slate-400">No payment history.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
    </div>
  )
}
