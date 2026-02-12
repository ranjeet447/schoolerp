"use client";

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, StudentProfileCard } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

export default function ChildProfileClient({ id }: { id: string }) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
            <TabsContent value="attendance"><div className="p-10 text-center text-muted-foreground">Attendance records will be available soon.</div></TabsContent>
            <TabsContent value="fees"><div className="p-10 text-center text-muted-foreground">Fee statements and payment history will be available soon.</div></TabsContent>
            <TabsContent value="exams"><div className="p-10 text-center text-muted-foreground">Exam results and schedules will be available soon.</div></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
