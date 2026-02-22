"use client"

import React, { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import {
  Inbox,
  CheckCircle,
  XCircle,
  TicketPercent,
  Receipt,
  Clock,
  CalendarCheck,
  Search,
  Loader2
} from "lucide-react"
import { 
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@schoolerp/ui"
import { format } from "date-fns"

type ApprovalRequest = {
  id: string
  request_type: "waiver" | "concession" | "cancellation" | "attendance_correction"
  requester_name: string
  student_name: string
  amount?: number
  reason: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export default function ApprovalsQueuePage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  // Action Dialog
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [selectedReq, setSelectedReq] = useState<ApprovalRequest | null>(null)
  const [remark, setRemark] = useState("")
  const [processing, setProcessing] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await apiClient(`/admin/approvals?status=${activeTab}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setRequests(Array.isArray(data) ? data : [])
      } else {
        toast.error("Failed to load approval requests")
      }
    } catch {
      toast.error("Failed to load approval requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [activeTab])

  const filteredRequests = requests.filter(r => 
    r.student_name.toLowerCase().includes(search.toLowerCase()) || 
    r.requester_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = async () => {
    if (!selectedReq || !actionType) return
    setProcessing(true)
    try {
      const res = await apiClient(`/admin/approvals/${selectedReq.id}/${actionType}`, {
        method: "POST",
        body: JSON.stringify({ remark })
      })
      if (!res.ok) throw new Error("Action failed")
      toast.success(`Request ${actionType}d successfully`)
      setActionModalOpen(false)
      loadRequests()
    } catch {
      toast.error(`Failed to ${actionType} request`)
    } finally {
      setProcessing(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "waiver": return <TicketPercent className="h-5 w-5 text-amber-500" />
      case "concession": return <TicketPercent className="h-5 w-5 text-emerald-500" />
      case "cancellation": return <Receipt className="h-5 w-5 text-destructive" />
      case "attendance_correction": return <CalendarCheck className="h-5 w-5 text-blue-500" />
      default: return <Inbox className="h-5 w-5 text-muted-foreground" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Approvals Inbox
            <span className="bg-destructive text-destructive-foreground text-sm font-bold px-2.5 py-0.5 rounded-full shadow-sm">
               {requests.length}
            </span>
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Review and process requests for concessions, waivers, and cancellations.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-2xl">
          <TabsTrigger value="pending" className="rounded-xl px-6">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="rounded-xl px-6">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-xl px-6">Rejected</TabsTrigger>
        </TabsList>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by student or requester..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-card border-border shadow-sm max-w-md"
          />
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
             <div className="flex items-center justify-center p-12 text-muted-foreground flex-col">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading requests...</p>
             </div>
          ) : filteredRequests.length === 0 ? (
             <Card className="border-dashed shadow-none bg-muted/20">
               <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                 <CheckCircle className="h-12 w-12 text-emerald-500 mb-4 opacity-50" />
                 <h3 className="text-xl font-bold text-foreground mb-1">All Caught Up!</h3>
                 <p className="text-muted-foreground">There are no {activeTab} requests in your inbox.</p>
               </CardContent>
             </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map(req => (
                <Card key={req.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow group">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {getTypeIcon(req.request_type)}
                        {req.request_type.replace("_", " ")}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground font-medium">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(req.created_at), "dd MMM, HH:mm")}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{req.student_name}</CardTitle>
                    <CardDescription className="text-xs">Requested by: {req.requester_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="bg-primary/5 rounded-xl p-3 mb-4 border border-primary/10">
                      {req.amount !== undefined && (
                        <div className="text-2xl font-black text-foreground mb-1">
                          {formatCurrency(req.amount)}
                        </div>
                      )}
                      <p className="text-sm font-medium text-muted-foreground italic line-clamp-2">"{req.reason}"</p>
                    </div>
                    
                    {activeTab === "pending" && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedReq(req);
                            setActionType("reject");
                            setRemark("");
                            setActionModalOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                        <Button 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setSelectedReq(req);
                            setActionType("approve");
                            setRemark("");
                            setActionModalOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? <CheckCircle className="h-6 w-6 text-emerald-500" /> : <XCircle className="h-6 w-6 text-destructive" />}
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              You are about to {actionType} the {selectedReq?.request_type} request for <span className="font-bold text-foreground">{selectedReq?.student_name}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                <div className="text-sm"><strong>Amount:</strong> {selectedReq?.amount ? formatCurrency(selectedReq.amount) : "N/A"}</div>
                <div className="text-sm"><strong>Reason:</strong> {selectedReq?.reason}</div>
             </div>
             
             <div className="space-y-2">
                <p className="text-sm font-bold">Add a remark (Optional)</p>
                <Textarea 
                  placeholder="Leave a note for the requester..." 
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  className="resize-none"
                />
             </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAction} 
              disabled={processing}
              className={actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm {actionType === "approve" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
