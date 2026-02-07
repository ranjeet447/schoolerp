"use client"

import { useState } from "react"
import { Button } from "@schoolerp/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function AddStudentDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      const res = await fetch('http://localhost:8080/v1/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'default-tenant', // Stub for now
        },
        body: JSON.stringify(data),
      })
      
      if (!res.ok) throw new Error('Failed to create')
      
      setOpen(false)
      // trigger refresh or mutate here
      window.location.reload() // brute force refresh for Release 1
    } catch (error) {
      console.error(error)
      alert('Failed to create student')
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
                <select id="gender" name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm col-span-3">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
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
