"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { Driver } from "@/types/transport"

interface DriverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  driver?: Driver | null
}

export function DriverDialog({ open, onOpenChange, onSuccess, driver }: DriverDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    license_number: "",
    phone: "",
    status: "active"
  })

  useEffect(() => {
    if (driver) {
      setFormData({
        full_name: driver.full_name,
        license_number: driver.license_number,
        phone: driver.phone,
        status: driver.status
      })
    } else {
      setFormData({
        full_name: "",
        license_number: "",
        phone: "",
        status: "active"
      })
    }
  }, [driver, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await apiClient("/transport/drivers", {
        method: "POST", // assuming Create for now
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        alert("Failed to save driver")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{driver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>License Number</Label>
            <Input 
              value={formData.license_number}
              onChange={(e) => setFormData({...formData, license_number: e.target.value})}
              placeholder="e.g. DL-1234567890"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="e.g. +91 9876543210"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(val) => setFormData({...formData, status: val})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
