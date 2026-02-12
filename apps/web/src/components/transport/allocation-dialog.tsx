"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { Allocation, Route, RouteStop } from "@/types/transport"
import { toast } from "sonner"

interface AllocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AllocationDialog({ open, onOpenChange, onSuccess }: AllocationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])
  const [stops, setStops] = useState<RouteStop[]>([])
  const [students, setStudents] = useState<any[]>([]) // Using any for student for now
  
  const [formData, setFormData] = useState({
    student_id: "",
    route_id: "",
    stop_id: "",
    start_date: new Date().toISOString().split('T')[0],
    status: "active"
  })

  useEffect(() => {
    if (open) {
      fetchDependencies()
    }
  }, [open])

  useEffect(() => {
    if (formData.route_id) {
      fetchStops(formData.route_id)
    } else {
      setStops([])
    }
  }, [formData.route_id])

  const fetchDependencies = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        apiClient("/admin/transport/routes"),
        apiClient("/admin/students?limit=100") // Simple fetch for now, should be search/autocomplete in real app
      ])
      
      if (rRes.ok) setRoutes(await rRes.json() || [])
      if (sRes.ok) setStudents(await sRes.json() || [])
    } catch (err) {
      console.error("Failed to load dependencies", err)
    }
  }

  const fetchStops = async (routeId: string) => {
    try {
      const res = await apiClient(`/admin/transport/routes/${routeId}/stops`)
      if (res.ok) {
        setStops(await res.json() || [])
      }
    } catch (err) {
      console.error("Failed to load stops", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await apiClient("/admin/transport/allocations", {
        method: "POST",
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Failed to create allocation")
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
          <DialogTitle>Assign Student to Transport</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select 
              value={formData.student_id} 
              onValueChange={(val) => setFormData({...formData, student_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Student" />
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
            <Label>Route</Label>
            <Select 
              value={formData.route_id} 
              onValueChange={(val) => setFormData({...formData, route_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Route" />
              </SelectTrigger>
              <SelectContent>
                {routes.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pickup / Drop Stop</Label>
            <Select 
              value={formData.stop_id} 
              onValueChange={(val) => setFormData({...formData, stop_id: val})}
              disabled={!formData.route_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.route_id ? "Select Stop" : "Select Route First"} />
              </SelectTrigger>
              <SelectContent>
                {stops.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (Seq: {s.sequence_order})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input 
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Assign" : "Assign Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
