"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { Book } from "@/types/library"
import { toast } from "sonner"

interface IssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function IssueDialog({ open, onOpenChange, onSuccess }: IssueDialogProps) {
  const [loading, setLoading] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [students, setStudents] = useState<any[]>([])

  const [formData, setFormData] = useState({
    book_id: "",
    student_id: "",
    days: "14"
  })

  useEffect(() => {
    if (open) {
      fetchDependencies()
    }
  }, [open])

  const fetchDependencies = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        apiClient("/admin/library/books?limit=100"),
        apiClient("/admin/students?limit=100")
      ])
      
      if (bRes.ok) setBooks(await bRes.json() || [])
      if (sRes.ok) setStudents(await sRes.json() || [])
    } catch (err) {
      console.error("Failed to load dependencies", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        days: parseInt(formData.days) || 14
      }

      const res = await apiClient("/admin/library/issues", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Failed to issue book. Check stock.")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Book to Student</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Book</Label>
            <Select 
              value={formData.book_id} 
              onValueChange={(val) => setFormData({...formData, book_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search by title..." />
              </SelectTrigger>
              <SelectContent>
                {books.map(b => (
                  <SelectItem key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                    {b.title} ({b.available_copies} avail)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Student</Label>
            <Select 
              value={formData.student_id} 
              onValueChange={(val) => setFormData({...formData, student_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name} ({s.admission_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Issue Duration (Days)</Label>
            <Select 
              value={formData.days} 
              onValueChange={(val) => setFormData({...formData, days: val})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Issue Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
