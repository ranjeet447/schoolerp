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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/transport/routes")
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

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
            <TabsTrigger value="list" className="gap-2">
                <Bus className="w-4 h-4" />
                Route List
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Live Tracking (Mock)
            </TabsTrigger>
        </TabsList>

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
            <Card className="h-[600px] overflow-hidden bg-slate-50 relative border-dashed">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Navigation className="w-12 h-12 text-primary rotate-45" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">GPS Simulation Active</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            In a production environment, this view would integrate with a maps provider (Google/Mapbox)
                            to show real-time vehicle positions from installed GPS hardware.
                        </p>
                    </div>
                    
                    {/* Visual Mock of vehicles moving */}
                    <div className="w-full max-w-lg h-32 bg-white rounded-lg border shadow-sm p-4 relative overflow-hidden mt-8">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2" />
                        
                        {routes.slice(0, 3).map((r, i) => (
                            <div 
                                key={r.id}
                                className="absolute flex flex-col items-center animate-bounce"
                                style={{ 
                                    left: `${20 + (i * 30)}%`, 
                                    top: '40%',
                                    animationDelay: `${i * 0.5}s`,
                                    animationDuration: '3s'
                                }}
                            >
                                <Bus className="w-6 h-6 text-primary" />
                                <span className="text-[10px] font-bold bg-white px-1 border rounded">{r.name}</span>
                            </div>
                        ))}
                    </div>

                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      3 Vehicles Online
                    </Badge>
                </div>
                
                {/* Mock Grid Lines */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </Card>
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
