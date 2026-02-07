"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Plus, MapPin, Bus, User } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Route } from "@/types/transport"
import { RouteDialog } from "@/components/transport/route-dialog"

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/transport/routes")
      if (res.ok) {
        const data = await res.json()
        setRoutes(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (route: Route) => {
    // setSelectedRoute(route)
    // setDialogOpen(true)
    alert("Edit not implemented in backend yet")
  }

  const handleCreate = () => {
    setSelectedRoute(null)
    setDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Route Operations</h1>
          <p className="text-muted-foreground">Manage transport routes and assignments.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Route
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Routes ({routes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading routes...
                  </TableCell>
                </TableRow>
              ) : routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No routes found. Create your first route.
                  </TableCell>
                </TableRow>
              ) : (
                routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {route.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {route.vehicle_number ? (
                         <div className="flex items-center gap-2">
                          <Bus className="w-3 h-3 text-muted-foreground" />
                          {route.vehicle_number}
                        </div>
                      ) : <span className="text-muted-foreground italic">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      {route.driver_name ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {route.driver_name}
                        </div>
                      ) : <span className="text-muted-foreground italic">Unassigned</span>}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {route.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* TODO: Add Manage Stops link */}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(route)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RouteDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchRoutes}
        route={selectedRoute}
      />
    </div>
  )
}
