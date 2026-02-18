"use client";

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, StudentProfileCard } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const boolValue = (value: unknown) => {
  if (typeof value === "boolean") return value
  if (value && typeof value === "object" && "Bool" in value) {
    return Boolean((value as { Bool?: boolean }).Bool)
  }
  return false
}

type Guardian = {
  id: unknown
  full_name: string
  phone: string
  email: unknown
  relationship: string
  is_primary: unknown
}

export default function StudentProfileClient({ id }: { id: string }) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loadingGuardians, setLoadingGuardians] = useState(false)
  const [savingGuardian, setSavingGuardian] = useState(false)
  const [guardianForm, setGuardianForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    relation: "father",
  })

  const fetchGuardians = async () => {
    setLoadingGuardians(true)
    try {
      const res = await apiClient(`/admin/students/${id}/guardians`)
      if (res.ok) {
        const data = await res.json()
        setGuardians(Array.isArray(data) ? data : [])
      } else {
        setGuardians([])
      }
    } catch (e) {
      console.error(e)
      setGuardians([])
    } finally {
      setLoadingGuardians(false)
    }
  }

  useEffect(() => {
    async function loadStudent() {
      try {
        const [studentRes] = await Promise.all([
          apiClient(`/admin/students/${id}`),
          fetchGuardians(),
        ])

        if (studentRes.ok) {
          const data = await studentRes.json()
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

  const addGuardian = async () => {
    if (!guardianForm.full_name.trim() || !guardianForm.phone.trim() || !guardianForm.relation.trim()) {
      return
    }

    setSavingGuardian(true)
    try {
      const res = await apiClient(`/admin/students/${id}/guardians`, {
        method: "POST",
        body: JSON.stringify({
          full_name: guardianForm.full_name,
          phone: guardianForm.phone,
          email: guardianForm.email,
          address: guardianForm.address,
          relation: guardianForm.relation,
          is_primary: guardians.length === 0,
        }),
      })
      if (res.ok) {
        setGuardianForm({
          full_name: "",
          phone: "",
          email: "",
          address: "",
          relation: "father",
        })
        await fetchGuardians()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingGuardian(false)
    }
  }

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
                 <h3 className="text-lg font-medium mb-4">Guardian Management</h3>

                 <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                   <div className="md:col-span-2 space-y-1">
                     <Label>Full Name</Label>
                     <Input
                       value={guardianForm.full_name}
                       onChange={(e) => setGuardianForm((prev) => ({ ...prev, full_name: e.target.value }))}
                       placeholder="Guardian full name"
                     />
                   </div>
                   <div className="space-y-1">
                     <Label>Phone</Label>
                     <Input
                       value={guardianForm.phone}
                       onChange={(e) => setGuardianForm((prev) => ({ ...prev, phone: e.target.value }))}
                       placeholder="Phone"
                     />
                   </div>
                   <div className="space-y-1">
                     <Label>Email</Label>
                     <Input
                       value={guardianForm.email}
                       onChange={(e) => setGuardianForm((prev) => ({ ...prev, email: e.target.value }))}
                       placeholder="Email"
                     />
                   </div>
                   <div className="space-y-1">
                     <Label>Relation</Label>
                     <Input
                       value={guardianForm.relation}
                       onChange={(e) => setGuardianForm((prev) => ({ ...prev, relation: e.target.value }))}
                       placeholder="father / mother / guardian"
                     />
                   </div>
                 </div>

                 <div className="flex justify-end mb-4">
                   <Button onClick={addGuardian} disabled={savingGuardian} className="gap-2">
                     {savingGuardian && <Loader2 className="h-4 w-4 animate-spin" />}
                     Add Guardian
                   </Button>
                 </div>

                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Name</TableHead>
                       <TableHead>Relation</TableHead>
                       <TableHead>Phone</TableHead>
                       <TableHead>Email</TableHead>
                       <TableHead>Primary</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {loadingGuardians ? (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center text-muted-foreground py-6">Loading guardians...</TableCell>
                       </TableRow>
                     ) : guardians.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No guardians linked.</TableCell>
                       </TableRow>
                     ) : (
                       guardians.map((guardian, index) => (
                         <TableRow key={`${guardian.full_name}-${index}`}>
                           <TableCell className="font-medium">{guardian.full_name}</TableCell>
                           <TableCell>{guardian.relationship}</TableCell>
                           <TableCell>{guardian.phone}</TableCell>
                           <TableCell>{textValue(guardian.email) || "-"}</TableCell>
                           <TableCell>{boolValue(guardian.is_primary) ? "Yes" : "No"}</TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
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
