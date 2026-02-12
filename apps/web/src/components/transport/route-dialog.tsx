"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { Route, Vehicle, Driver } from "@/types/transport"
import { toast } from "sonner"

interface RouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  route?: Route | null
}

export function RouteDialog({ open, onOpenChange, onSuccess, route }: RouteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  
  const [formData, setFormData] = useState({
    name: "",
    vehicle_id: "",
    driver_id: "",
    description: ""
  })

  useEffect(() => {
    if (open) {
      fetchDependencies()
    }
  }, [open])

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        vehicle_id: route.vehicle_id || "",
        driver_id: route.driver_id || "",
        description: route.description || ""
      })
    } else {
      setFormData({
        name: "",
        vehicle_id: "",
        driver_id: "",
        description: ""
      })
    }
  }, [route, open])

  const fetchDependencies = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        apiClient("/admin/transport/vehicles"),
        apiClient("/admin/transport/drivers")
      ])
      
      if (vRes.ok) setVehicles(await vRes.json() || [])
      if (dRes.ok) setDrivers(await dRes.json() || [])
    } catch (err) {
      console.error("Failed to load dependencies", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = route 
        ? `/admin/transport/routes/${route.id}` 
        : "/admin/transport/routes"
        
      const res = await apiClient(url, {
        method: route ? "PUT" : "POST",
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(route ? "Route updated" : "Route created")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Failed to save route")
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
          <DialogTitle>{route ? "Edit Route" : "Create New Route"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Route Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Route 1 - North Zone"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Assigned Vehicle</Label>
            <Select 
              value={formData.vehicle_id} 
              onValueChange={(val) => setFormData({...formData, vehicle_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.registration_number} ({v.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assigned Driver</Label>
            <Select 
              value={formData.driver_id} 
              onValueChange={(val) => setFormData({...formData, driver_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name} ({d.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="e.g. Covers MG Road, Indiranagar..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
