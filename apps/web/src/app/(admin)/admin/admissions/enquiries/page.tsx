"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { AdmissionEnquiry } from "@/types/admission"
import { format } from "date-fns"

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/admissions/enquiries?limit=50")
      if (res.ok) {
        setEnquiries(await res.json() || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await apiClient(`/admin/admissions/enquiries/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus as any } : e))
      }
    } catch (err) {
      console.error(err)
      alert("Failed to update status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default'
      case 'contacted': return 'secondary'
      case 'interview_scheduled': return 'outline'
      case 'converted': return 'default' // Using default (primary) for success mostly
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admission Enquiries</h1>
          <p className="text-muted-foreground">Manage incoming enquiries from the public portal.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enquiries ({enquiries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Parent Name</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading enquiries...
                  </TableCell>
                </TableRow>
              ) : enquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No enquiries found.
                  </TableCell>
                </TableRow>
              ) : (
                enquiries.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(enquiry.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{enquiry.parent_name}</TableCell>
                    <TableCell>{enquiry.student_name}</TableCell>
                    <TableCell>{enquiry.grade_interested}</TableCell>
                    <TableCell>
                        <div className="text-sm">
                            <div>{enquiry.phone}</div>
                            <div className="text-muted-foreground text-xs">{enquiry.email}</div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Select 
                            value={enquiry.status} 
                            onValueChange={(val) => updateStatus(enquiry.id, val)}
                        >
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="interview_scheduled">Interview</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
