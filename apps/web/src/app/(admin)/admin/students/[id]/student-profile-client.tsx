"use client";

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, StudentProfileCard } from "@schoolerp/ui"

export default function StudentProfileClient({ id }: { id: string }) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStudent() {
      const tenant = localStorage.getItem('tenant_id');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';
      try {
        const res = await fetch(`${API_URL}/admin/students/${id}`, {
          headers: {
            "X-Tenant-ID": tenant || '',
          }
        })
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
        <h2 className="text-2xl font-bold">Student not found</h2>
        <Button asChild className="mt-4">
          <Link href="/admin/students">Back to Students</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/students">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StudentProfileCard student={student} />
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="guardians">Guardians</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="py-4">
               <div className="rounded-lg border bg-card p-6">
                 <h3 className="text-lg font-medium mb-4">Academic Information</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-muted-foreground">Current Class</p>
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
                   <div>
                     <p className="text-sm text-muted-foreground">Admission Date</p>
                     <p className="font-medium">{new Date(student.created_at).toLocaleDateString()}</p>
                   </div>
                 </div>
               </div>
            </TabsContent>
            <TabsContent value="guardians" className="py-4">
               <div className="rounded-lg border bg-card p-6">
                 <p className="text-sm text-muted-foreground">Guardian details will be displayed here.</p>
               </div>
            </TabsContent>
            <TabsContent value="attendance" className="py-4">
               <div className="rounded-lg border bg-card p-6">
                 <p className="text-sm text-muted-foreground">Attendance history will be displayed here.</p>
               </div>
            </TabsContent>
            <TabsContent value="fees" className="py-4">
               <div className="rounded-lg border bg-card p-6">
                 <p className="text-sm text-muted-foreground">Fee statements will be displayed here.</p>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
