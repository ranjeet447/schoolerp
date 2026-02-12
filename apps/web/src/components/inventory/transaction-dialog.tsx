"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { InventoryItem, InventorySupplier } from "@/types/inventory"
import { toast } from "sonner"

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TransactionDialog({ open, onOpenChange, onSuccess }: TransactionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([])
  
  const [formData, setFormData] = useState({
    item_id: "",
    type: "in",
    quantity: "1",
    unit_price: "0",
    supplier_id: "",
    location: "Main Store",
    remarks: ""
  })

  useEffect(() => {
    if (open) {
      fetchDependencies()
    }
  }, [open])

  const fetchDependencies = async () => {
    try {
      const [iRes, sRes] = await Promise.all([
        apiClient("/admin/inventory/items?limit=100"),
        apiClient("/admin/inventory/suppliers?limit=100")
      ])
      
      if (iRes.ok) setItems(await iRes.json() || [])
      if (sRes.ok) setSuppliers(await sRes.json() || [])
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
        quantity: parseInt(formData.quantity) || 0,
        unit_price:parseFloat(formData.unit_price) || 0
      }

      const res = await apiClient("/admin/inventory/transactions", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Failed to record transaction")
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
          <DialogTitle>Record Stock Transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Select Item</Label>
              <Select 
                value={formData.item_id} 
                onValueChange={(val) => setFormData({...formData, item_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search Item..." />
                </SelectTrigger>
                <SelectContent>
                  {items.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} (Stock: {i.current_stock} {i.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val) => setFormData({...formData, type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In (Purchase)</SelectItem>
                  <SelectItem value="out">Stock Out (Issue)</SelectItem>
                  {/* <SelectItem value="adjustment">Adjustment</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                min="1"
                required
              />
            </div>

            {formData.type === 'in' && (
              <>
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input 
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select 
                    value={formData.supplier_id} 
                    onValueChange={(val) => setFormData({...formData, supplier_id: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2 col-span-2">
                <Label>Store Location</Label>
                <Input 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea 
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              placeholder="Reason for stock movement..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Confirm Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
