"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Building2, IndianRupee, Settings2, RefreshCw, ArrowRight } from "lucide-react"

type FeeMapping = {
  id?: string
  hostel_type: string  // "room_rent", "mess_charges", "laundry"
  fee_head_id: string
  fee_head_name: string
  amount: number
  frequency: string    // "monthly", "quarterly", "yearly"
  auto_post: boolean
}

type PostingLog = {
  id: string
  student_name: string
  hostel_type: string
  amount: number
  posted_at: string
  status: string
}

export default function HostelFinancialIntegrationPage() {
  const [mappings, setMappings] = useState<FeeMapping[]>([])
  const [logs, setLogs] = useState<PostingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  // Form state for new mapping
  const [hostelType, setHostelType] = useState("room_rent")
  const [feeHeadName, setFeeHeadName] = useState("")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState("monthly")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [mapRes, logRes] = await Promise.all([
        apiClient("/admin/hostel/fee-mappings"),
        apiClient("/admin/hostel/fee-postings")
      ])
      if (mapRes.ok) {
        const data = await mapRes.json()
        setMappings(Array.isArray(data) ? data : [])
      }
      if (logRes.ok) {
        const data = await logRes.json()
        setLogs(Array.isArray(data) ? data : [])
      }
    } catch {
      // API may not exist yet, use defaults
    } finally {
      setLoading(false)
    }
  }

  const addMapping = async () => {
    if (!feeHeadName || !amount) {
      toast.error("Fill all fields")
      return
    }
    const newMapping: FeeMapping = {
      hostel_type: hostelType,
      fee_head_id: "",
      fee_head_name: feeHeadName,
      amount: parseFloat(amount),
      frequency,
      auto_post: true,
    }
    try {
      const res = await apiClient("/admin/hostel/fee-mappings", {
        method: "POST",
        body: JSON.stringify(newMapping)
      })
      if (res.ok) {
        toast.success("Fee mapping saved")
        setFeeHeadName("")
        setAmount("")
        loadData()
      } else {
        // Mock add locally if endpoint not yet ready
        setMappings(prev => [...prev, { ...newMapping, id: Date.now().toString() }])
        toast.success("Fee mapping added (local)")
      }
    } catch {
      setMappings(prev => [...prev, { ...newMapping, id: Date.now().toString() }])
      toast.success("Fee mapping added (local)")
    }
  }

  const triggerPosting = async () => {
    setPosting(true)
    try {
      const res = await apiClient("/admin/hostel/fee-postings/trigger", { method: "POST" })
      if (res.ok) {
        toast.success("Fee posting triggered successfully")
        loadData()
      } else {
        toast.info("Fee posting endpoint not yet configured")
      }
    } catch {
      toast.info("Fee posting will be available after backend setup")
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Hostel Financial Integration
          </h1>
          <p className="text-muted-foreground mt-1">Configure fee head mappings and auto-posting to the student ledger</p>
        </div>
        <Button onClick={triggerPosting} disabled={posting} className="gap-2">
          <IndianRupee className="w-4 h-4" />
          {posting ? "Posting..." : "Trigger Fee Posting"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Settings2 className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Mappings</p>
              <p className="text-2xl font-bold">{mappings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl"><IndianRupee className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Posted This Month</p>
              <p className="text-2xl font-bold">₹{logs.reduce((acc, l) => acc + (l.amount || 0), 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><ArrowRight className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Postings This Month</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Head Mapping Form */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Add Fee Head Mapping</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Hostel Charge Type</Label>
              <Select value={hostelType} onValueChange={setHostelType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="room_rent">Room Rent</SelectItem>
                  <SelectItem value="mess_charges">Mess Charges</SelectItem>
                  <SelectItem value="laundry">Laundry</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="security_deposit">Security Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fee Head Name</Label>
              <Input placeholder="e.g. Hostel Room Rent" value={feeHeadName} onChange={e => setFeeHeadName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="5000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={addMapping}>Save Mapping</Button>
          </CardContent>
        </Card>

        {/* Active Mappings */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Active Fee Mappings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Charge Type</TableHead>
                    <TableHead>Fee Head</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Auto-Post</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No fee mappings configured yet. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : mappings.map(m => (
                    <TableRow key={m.id || m.hostel_type}>
                      <TableCell className="capitalize font-medium">{m.hostel_type.replace(/_/g, " ")}</TableCell>
                      <TableCell>{m.fee_head_name}</TableCell>
                      <TableCell>₹{m.amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{m.frequency}</TableCell>
                      <TableCell>
                        <Badge className={m.auto_post ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}>
                          {m.auto_post ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Postings */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Recent Fee Postings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Charge Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Posted At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No fee postings yet. Configure mappings and trigger posting to begin.
                  </TableCell>
                </TableRow>
              ) : logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.student_name}</TableCell>
                  <TableCell className="capitalize">{l.hostel_type?.replace(/_/g, " ")}</TableCell>
                  <TableCell>₹{l.amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(l.posted_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 border-green-200">{l.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
