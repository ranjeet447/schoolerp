"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Avatar,
  AvatarFallback
} from "@schoolerp/ui"
import { MapPin, Bus, User, Map, Fuel, Users, Plus, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState("routes")
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [routes, setRoutes] = useState([])
  const [allocations, setAllocations] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)


  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    const res = await Promise.all([
      apiClient("/transport/vehicles"),
      apiClient("/transport/drivers"),
      apiClient("/transport/routes"),
      apiClient("/transport/allocations"),
      apiClient("/transport/fuel-logs")
    ])

    if (res[0].ok) setVehicles(await res[0].json())
    if (res[1].ok) setDrivers(await res[1].json())
    if (res[2].ok) setRoutes(await res[2].json())
    if (res[3].ok) setAllocations(await res[3].json())
    if (res[4].ok) setFuelLogs(await res[4].json())
    
    setLoading(false)
  }

  const handleGenerateFees = async () => {
    if (!confirm("Are you sure you want to generate transport fees for all active allocations?")) return
    
    setGenerating(true)
    try {
      const res = await apiClient("/transport/generate-fees", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Generated fees for ${data.count} student(s)`)
      } else {
        const error = await res.text()
        toast.error(error || "Generation failed")
      }
    } catch (err) {
      toast.error("Network error during fee generation")
    } finally {
      setGenerating(false)
    }
  }


  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Transport Network</h1>
          <p className="text-muted-foreground font-medium">Coordinate fleet, routes, and student safety.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleGenerateFees} disabled={generating} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Fuel className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} /> 
                {generating ? 'Generating...' : 'Generate Fees'}
            </Button>
            <Button className="bg-foreground hover:bg-foreground/90 text-background">
                <Plus className="h-4 w-4 mr-2" /> Add Vehicle
            </Button>
            <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" /> Planner
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted border-border/50 p-1 rounded-xl">
          <TabsTrigger value="routes" className="rounded-lg gap-2"><Map className="h-4 w-4" /> Transit Routes</TabsTrigger>
          <TabsTrigger value="fleet" className="rounded-lg gap-2"><Bus className="h-4 w-4" /> Vehicle Fleet</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg gap-2"><User className="h-4 w-4" /> Drivers</TabsTrigger>
          <TabsTrigger value="allocations" className="rounded-lg gap-2"><Users className="h-4 w-4" /> Student Link</TabsTrigger>
          <TabsTrigger value="fuel" className="rounded-lg gap-2"><Fuel className="h-4 w-4" /> Fuel Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {routes.map((route: any) => (
                <Card key={route.id} className="bg-card border-border/50 rounded-3xl overflow-hidden group hover:border-primary/30 shadow-sm transition-all">
                  <div className="h-2 bg-primary w-full" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-black text-foreground">{route.name}</CardTitle>
                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                            {route.vehicle_reg || 'No Vehicle'}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{route.description || 'Main transport route'}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 py-2 border-y border-border/50">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Driver</p>
                            <p className="text-foreground font-medium">{route.driver_name || 'Unassigned'}</p>
                        </div>
                        <div className="flex-1 text-right">
                           <p className="text-xs font-bold text-muted-foreground uppercase">Capacity</p>
                           <p className="text-foreground font-medium">{route.allocation_count || 0} / {route.vehicle_capacity || 0}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 px-0">
                            View 12 Stops
                        </Button>
                        <Button size="sm" variant="secondary">Edit Route</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="fleet">
            <Card className="bg-card shadow-sm border-border/50 rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border/50">
                        <TableHead>Registration</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Maintenance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.map((v: any) => (
                          <TableRow key={v.id} className="hover:bg-muted/50 border-border/50">
                            <TableCell className="font-bold text-foreground">{v.registration_number}</TableCell>
                            <TableCell className="text-muted-foreground capitalize">{v.type}</TableCell>
                            <TableCell className="text-muted-foreground">{v.capacity} Seater</TableCell>
                            <TableCell>
                                <Badge className={v.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}>
                                    {v.status.toUpperCase()}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-emerald-500 text-sm flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Fit
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </TabsContent>

        <TabsContent value="staff">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {drivers.map((d: any) => (
                  <Card key={d.id} className="bg-card shadow-sm border-border/50 rounded-3xl">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-12 w-12 bg-muted">
                            <AvatarFallback>{d.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{d.full_name}</CardTitle>
                            <p className="text-xs text-muted-foreground">License: {d.license_number}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <p className="text-sm text-muted-foreground">Tel: {d.phone}</p>
                        <Badge variant="secondary" className="mt-2 text-[10px] uppercase font-bold">{d.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="fuel">
            <Card className="bg-card shadow-sm border-border/50 rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Qty (Ltr)</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Odo Reading</TableHead>
                        <TableHead>Logged By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fuelLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <Fuel className="h-12 w-12 mb-4 mx-auto opacity-20 text-primary" />
                                    <p className="text-muted-foreground">No fuel logs found for this period.</p>
                                    <Button variant="outline" className="mt-4 border-border hover:bg-muted/50">Add Manual Entry</Button>
                                </TableCell>
                            </TableRow>
                        ) : fuelLogs.map((log: any) => (
                          <TableRow key={log.id} className="hover:bg-muted/50 border-border/50">
                            <TableCell className="text-muted-foreground">{new Date(log.fill_date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-bold text-foreground">{log.vehicle_reg}</TableCell>
                            <TableCell className="text-foreground font-medium">{log.quantity}</TableCell>
                            <TableCell className="text-emerald-500 font-bold">₹ {log.total_cost}</TableCell>
                            <TableCell className="text-muted-foreground">{log.odometer_reading}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{log.user_name}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </TabsContent>

        <TabsContent value="allocations">
            <Card className="bg-card shadow-sm border-border/50 rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border/50">
                        <TableHead>Student</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Stop</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allocations.map((a: any) => (
                          <TableRow key={a.id} className="hover:bg-muted/50 border-border/50">
                            <TableCell className="font-bold text-foreground">{a.student_name}</TableCell>
                            <TableCell className="text-muted-foreground">{a.route_name}</TableCell>
                            <TableCell className="text-muted-foreground">{a.stop_name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{new Date(a.start_date).toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant="outline" className="text-emerald-500 border-emerald-500/20">{a.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
