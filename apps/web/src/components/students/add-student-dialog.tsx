"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@schoolerp/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@schoolerp/ui"
import { Input } from "@schoolerp/ui"
import { Label } from "@schoolerp/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { Plus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { ClassSelect } from "@/components/ui/class-select"
import { SectionSelect } from "@/components/ui/section-select"

export function AddStudentDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState("male")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const data = { 
      ...Object.fromEntries(formData), 
      gender,
      class_id: classId,
      section_id: sectionId
    }

    try {
      const res = await apiClient('/admin/students', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || 'Failed to create student')
      }
      
      setOpen(false)
      setGender("male")
      setClassId("")
      setSectionId("")
      toast.success('Student created successfully')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to create student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Create a new student record in the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="admission_number" className="text-right">
                  Adm. No
                  </Label>
                  <Input
                  id="admission_number"
                  name="admission_number"
                  placeholder="A-001"
                  className="col-span-3"
                  required
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                  Name
                  </Label>
                  <Input
                  id="full_name"
                  name="full_name"
                  placeholder="John Doe"
                  className="col-span-3"
                  required
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gender" className="text-right">
                  Gender
                  </Label>
                  <div className="col-span-3">
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dob" className="text-right">
                  DOB
                  </Label>
                  <Input
                  id="dob"
                  name="dob"
                  type="date"
                  className="col-span-3"
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roll_number" className="text-right">
                  Roll No
                  </Label>
                  <Input
                  id="roll_number"
                  name="roll_number"
                  placeholder="10"
                  className="col-span-3"
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                  Address
                  </Label>
                  <Input
                  id="address"
                  name="address"
                  placeholder="123 Street, City"
                  className="col-span-3"
                  />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="class_id" className="text-right">
                  Class
                  </Label>
                  <div className="col-span-3">
                     <ClassSelect 
                        value={classId} 
                        onSelect={(v) => { setClassId(v); setSectionId(""); }} 
                     />
                  </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="section_id" className="text-right">
                  Section
                  </Label>
                  <div className="col-span-3">
                     <SectionSelect 
                        value={sectionId} 
                        onSelect={setSectionId} 
                        classId={classId}
                        disabled={!classId}
                     />
                  </div>
              </div>
            </div>
            
            <DialogFooter>
            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save changes'}
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
