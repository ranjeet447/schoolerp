import React from "react"
import Link from "next/link"
import { Button } from "@schoolerp/ui"
import { ChevronLeft } from "lucide-react"
import { StudentProfileCard } from "@/components/students/student-profile-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getStudent(id: string) {
  try {
    const res = await fetch(`http://localhost:8080/v1/admin/students/${id}`, {
      headers: {
        "X-Tenant-ID": "default-tenant", // Stub
      },
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json()
  } catch (e) {
    console.error(e)
    return null
  }
}

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const student = await getStudent(params.id)

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold">Student not found</h2>
        <Button asChild className="mt-4">
          <Link href="/students">Back to Students</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/students">
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
