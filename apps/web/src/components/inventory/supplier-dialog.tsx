"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Textarea
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { InventorySupplier } from "@/types/inventory"
import { toast } from "sonner"

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  supplier?: InventorySupplier | null
}

export function SupplierDialog({ open, onOpenChange, onSuccess, supplier }: SupplierDialogProps) {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: ""
  })

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || ""
      })
    } else {
      setFormData({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: ""
      })
    }
  }, [supplier, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = supplier
        ? `/admin/inventory/suppliers/${supplier.id}`
        : "/admin/inventory/suppliers"

      const res = await apiClient(url, {
        method: supplier ? "PUT" : "POST",
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(supplier ? "Supplier updated" : "Supplier added")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Failed to save supplier")
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
          <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input 
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
