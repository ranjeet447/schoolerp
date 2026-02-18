"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Plus, MapPin, Bus, User, Navigation } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Route } from "@/types/transport"
import { RouteDialog } from "@/components/transport/route-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@schoolerp/ui"

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient("/admin/transport/routes")
      if (res.ok) {
        const data = await res.json()
        setRoutes(data || [])
      } else {
        const msg = await res.text()
        setError(msg || "Failed to fetch routes")
      }
    } catch (err) {
      setError("Failed to fetch routes")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (route: Route) => {
    setSelectedRoute(route)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedRoute(null)
    setDialogOpen(true)
  }

  const assignedVehicleCount = routes.filter((route) => !!route.vehicle_number).length
  const assignedDriverCount = routes.filter((route) => !!route.driver_name).length
  const unassignedCount = routes.filter((route) => !route.vehicle_number || !route.driver_name).length

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

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
            <TabsTrigger value="list" className="gap-2">
                <Bus className="w-4 h-4" />
                Route List
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Operations Status
            </TabsTrigger>
        </TabsList>

        {error && (
          <Card>
            <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
          </Card>
        )}

        <TabsContent value="list" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="tracking">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{assignedVehicleCount}</div>
                <p className="text-sm text-muted-foreground">Routes with a linked vehicle</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{assignedDriverCount}</div>
                <p className="text-sm text-muted-foreground">Routes with a linked driver</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Needs Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{unassignedCount}</div>
                <p className="text-sm text-muted-foreground">Routes missing vehicle or driver</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <RouteDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchRoutes}
        route={selectedRoute}
      />
    </div>
  )
}
