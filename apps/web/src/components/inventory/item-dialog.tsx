"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { InventoryItem, InventoryCategory } from "@/types/inventory"

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  item?: InventoryItem | null
}

export function ItemDialog({ open, onOpenChange, onSuccess, item }: ItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    sku: "",
    unit: "pcs",
    reorder_level: "5",
    description: ""
  })

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category_id: item.category_id || "",
        sku: item.sku || "",
        unit: item.unit || "pcs",
        reorder_level: item.reorder_level?.toString() || "5",
        description: item.description || ""
      })
    } else {
      setFormData({
        name: "",
        category_id: "",
        sku: "",
        unit: "pcs",
        reorder_level: "5",
        description: ""
      })
    }
  }, [item, open])

  const fetchCategories = async () => {
    try {
      const res = await apiClient("/admin/inventory/categories")
      if (res.ok) {
        setCategories(await res.json() || [])
      }
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        reorder_level: parseInt(formData.reorder_level) || 0
      }

      const res = await apiClient("/admin/inventory/items", {
        method: "POST", // TODO: PUT for update
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        alert("Failed to save item")
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
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Item Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(val) => setFormData({...formData, category_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>SKU / Code</Label>
              <Input 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(val) => setFormData({...formData, unit: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="ltr">Liters</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pkt">Packet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input 
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
