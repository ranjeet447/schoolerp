"use client";

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Badge, Button, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger, StudentProfileCard } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

const asArray = (payload: any) => (Array.isArray(payload) ? payload : payload?.data || [])
const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const s = (value as { String?: string }).String
    return typeof s === "string" ? s : ""
  }
  return ""
}
const tsValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Time" in value) {
    const t = (value as { Time?: string }).Time
    return typeof t === "string" ? t : ""
  }
  return ""
}
const numberValue = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function ChildProfileClient({ id }: { id: string }) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(true)
  const [tabError, setTabError] = useState("")
  const [leaves, setLeaves] = useState<any[]>([])
  const [feeSummary, setFeeSummary] = useState<any>(null)
  const [receipts, setReceipts] = useState<any[]>([])
  const [examGroups, setExamGroups] = useState<Array<{ examName: string; rows: Array<{ subject: string; marks: number; maxMarks: number }> }>>([])
  const [notices, setNotices] = useState<any[]>([])

  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await apiClient(`/parent/children/${id}/profile`)
        if (res.ok) {
          const data = await res.json()
          setStudent(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadStudent()
  }, [id])

  useEffect(() => {
    async function loadTabData() {
      setTabLoading(true)
      setTabError("")
      try {
        const [leaveRes, summaryRes, receiptRes, examRes, noticesRes] = await Promise.all([
          apiClient(`/parent/leaves?student_id=${encodeURIComponent(id)}`),
          apiClient(`/parent/children/${id}/fees/summary`),
          apiClient(`/parent/children/${id}/fees/receipts`),
          apiClient(`/parent/children/${id}/exams/results`),
          apiClient("/parent/notices"),
        ])

        if (leaveRes.ok) {
          const payload = await leaveRes.json()
          setLeaves(asArray(payload))
        } else {
          setLeaves([])
        }

        if (summaryRes.ok) {
          const payload = await summaryRes.json()
          setFeeSummary(payload || null)
        } else {
          setFeeSummary(null)
        }

        if (receiptRes.ok) {
          const payload = await receiptRes.json()
          setReceipts(asArray(payload))
        } else {
          setReceipts([])
        }

        if (examRes.ok) {
          const payload = await examRes.json()
          const rows = asArray(payload)
          const grouped = new Map<string, Array<{ subject: string; marks: number; maxMarks: number }>>()
          for (const row of rows) {
            const examName = String(row?.exam_name || row?.examName || "Exam")
            if (!grouped.has(examName)) grouped.set(examName, [])
            grouped.get(examName)?.push({
              subject: String(row?.subject_name || row?.subject || "Subject"),
              marks: numberValue(row?.marks_obtained ?? row?.marks),
              maxMarks: numberValue(row?.max_marks ?? row?.maxMarks ?? 100),
            })
          }
          setExamGroups(Array.from(grouped.entries()).map(([examName, rows]) => ({ examName, rows })))
        } else {
          setExamGroups([])
        }

        if (noticesRes.ok) {
          const payload = await noticesRes.json()
          setNotices(asArray(payload).slice(0, 5))
        } else {
          setNotices([])
        }
      } catch (e) {
        setTabError(e instanceof Error ? e.message : "Failed to load profile tabs")
      } finally {
        setTabLoading(false)
      }
    }

    loadTabData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold">Child profile not found</h2>
        <Button asChild className="mt-4">
          <Link href="/parent/children">Back to My Children</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/parent/children">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{student.full_name}'s Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StudentProfileCard student={student} />
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees & Payments</TabsTrigger>
              <TabsTrigger value="exams">Exams</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="py-4">
               <div className="rounded-lg border bg-card p-6">
                 <h3 className="text-lg font-medium mb-4">Academic Details</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-muted-foreground">Class</p>
                     <p className="font-medium">{student.class_name || "N/A"}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Section</p>
                     <p className="font-medium">{student.section_name || "N/A"}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Roll Number</p>
                     <p className="font-medium">{student.roll_number || "N/A"}</p>
                   </div>
                 </div>
               </div>
            </TabsContent>
            <TabsContent value="attendance" className="py-4">
              {tabLoading ? (
                <div className="p-8 text-sm text-muted-foreground">Loading attendance...</div>
              ) : tabError ? (
                <div className="p-8 text-sm text-red-600 dark:text-red-400">{tabError}</div>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total leave requests</span>
                      <span className="font-semibold">{leaves.length}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <Badge variant="secondary">Approved: {leaves.filter((item) => String(item?.status || "").toLowerCase() === "approved").length}</Badge>
                      <Badge variant="secondary">Pending: {leaves.filter((item) => String(item?.status || "").toLowerCase() === "pending").length}</Badge>
                      <Badge variant="secondary">Rejected: {leaves.filter((item) => String(item?.status || "").toLowerCase() === "rejected").length}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="fees" className="py-4">
              {tabLoading ? (
                <div className="p-8 text-sm text-muted-foreground">Loading fees...</div>
              ) : tabError ? (
                <div className="p-8 text-sm text-red-600 dark:text-red-400">{tabError}</div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-semibold">₹{numberValue(feeSummary?.total_amount ?? feeSummary?.total).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Paid</div>
                        <div className="font-semibold">₹{numberValue(feeSummary?.paid_amount ?? feeSummary?.paid).toLocaleString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 space-y-2">
                      {receipts.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No receipts found.</div>
                      ) : receipts.slice(0, 5).map((receipt) => (
                        <div key={String(receipt?.id || receipt?.receipt_number)} className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0">
                          <span>{String(receipt?.receipt_number || "Receipt")}</span>
                          <span className="font-medium">₹{numberValue(receipt?.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            <TabsContent value="exams" className="py-4">
              {tabLoading ? (
                <div className="p-8 text-sm text-muted-foreground">Loading exams...</div>
              ) : tabError ? (
                <div className="p-8 text-sm text-red-600 dark:text-red-400">{tabError}</div>
              ) : examGroups.length === 0 ? (
                <div className="p-8 text-sm text-muted-foreground">No exam results found.</div>
              ) : (
                <div className="space-y-4">
                  {examGroups.map((exam) => (
                    <Card key={exam.examName}>
                      <CardContent className="pt-6 space-y-2">
                        <div className="font-semibold">{exam.examName}</div>
                        {exam.rows.map((row, idx) => (
                          <div key={`${exam.examName}-${idx}`} className="flex items-center justify-between text-sm">
                            <span>{row.subject}</span>
                            <span className="font-medium">{row.marks}/{row.maxMarks}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="notices" className="py-4">
              {tabLoading ? (
                <div className="p-8 text-sm text-muted-foreground">Loading notices...</div>
              ) : tabError ? (
                <div className="p-8 text-sm text-red-600 dark:text-red-400">{tabError}</div>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    {notices.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No notices available.</div>
                    ) : notices.map((notice) => (
                      <div key={textValue(notice?.id) || tsValue(notice?.created_at)} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="font-medium text-sm">{textValue(notice?.title) || "Notice"}</div>
                        <div className="text-xs text-muted-foreground mt-1">{textValue(notice?.body)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
