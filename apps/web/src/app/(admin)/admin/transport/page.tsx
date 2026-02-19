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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Transport Network</h1>
          <p className="text-slate-400 font-medium">Coordinate fleet, routes, and student safety.</p>
        </div>
        <div className="flex gap-2">
            <Button className="bg-indigo-600">
                <Plus className="h-4 w-4 mr-2" /> Add Vehicle
            </Button>
            <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" /> Planner
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900 border-white/5 p-1 rounded-xl">
          <TabsTrigger value="routes" className="rounded-lg gap-2"><Map className="h-4 w-4" /> Transit Routes</TabsTrigger>
          <TabsTrigger value="fleet" className="rounded-lg gap-2"><Bus className="h-4 w-4" /> Vehicle Fleet</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg gap-2"><User className="h-4 w-4" /> Drivers</TabsTrigger>
          <TabsTrigger value="allocations" className="rounded-lg gap-2"><Users className="h-4 w-4" /> Student Link</TabsTrigger>
          <TabsTrigger value="fuel" className="rounded-lg gap-2"><Fuel className="h-4 w-4" /> Fuel Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {routes.map((route: any) => (
                <Card key={route.id} className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden group hover:border-indigo-500/30 transition-all">
                  <div className="h-2 bg-indigo-500 w-full" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-black text-white">{route.name}</CardTitle>
                        <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 bg-indigo-400/5">
                            {route.vehicle_reg || 'No Vehicle'}
                        </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{route.description || 'Main transport route'}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 py-2 border-y border-white/5">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-600 uppercase">Driver</p>
                            <p className="text-white font-medium">{route.driver_name || 'Unassigned'}</p>
                        </div>
                        <div className="flex-1 text-right">
                           <p className="text-xs font-bold text-slate-600 uppercase">Capacity</p>
                           <p className="text-white font-medium">{route.allocation_count || 0} / {route.vehicle_capacity || 0}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-white px-0">
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
            <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow>
                        <TableHead>Registration</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Maintenance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.map((v: any) => (
                          <TableRow key={v.id} className="hover:bg-white/5 border-white/5">
                            <TableCell className="font-bold text-white">{v.registration_number}</TableCell>
                            <TableCell className="text-slate-400 capitalize">{v.type}</TableCell>
                            <TableCell className="text-slate-400">{v.capacity} Seater</TableCell>
                            <TableCell>
                                <Badge className={v.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}>
                                    {v.status.toUpperCase()}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-emerald-400 text-sm flex items-center gap-1">
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
                  <Card key={d.id} className="bg-slate-900/50 border-white/5 rounded-3xl">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-12 w-12 bg-slate-800">
                            <AvatarFallback>{d.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{d.full_name}</CardTitle>
                            <p className="text-xs text-slate-500">License: {d.license_number}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <p className="text-sm text-slate-400">Tel: {d.phone}</p>
                        <Badge variant="secondary" className="mt-2">{d.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="fuel">
            <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow>
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
                                    <Fuel className="h-12 w-12 mb-4 mx-auto opacity-20 text-indigo-400" />
                                    <p className="text-slate-500">No fuel logs found for this period.</p>
                                    <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5">Add Manual Entry</Button>
                                </TableCell>
                            </TableRow>
                        ) : fuelLogs.map((log: any) => (
                          <TableRow key={log.id} className="hover:bg-white/5 border-white/5">
                            <TableCell className="text-slate-400">{new Date(log.fill_date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-bold text-white">{log.vehicle_reg}</TableCell>
                            <TableCell className="text-white font-medium">{log.quantity}</TableCell>
                            <TableCell className="text-emerald-400 font-bold">₹ {log.total_cost}</TableCell>
                            <TableCell className="text-slate-500">{log.odometer_reading}</TableCell>
                            <TableCell className="text-slate-400 text-sm">{log.user_name}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </TabsContent>

        <TabsContent value="allocations">
            <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Stop</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allocations.map((a: any) => (
                          <TableRow key={a.id} className="hover:bg-white/5 border-white/5">
                            <TableCell className="font-bold text-white">{a.student_name}</TableCell>
                            <TableCell className="text-slate-400">{a.route_name}</TableCell>
                            <TableCell className="text-slate-400">{a.stop_name}</TableCell>
                            <TableCell className="text-slate-500 text-sm">{new Date(a.start_date).toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant="outline" className="text-emerald-400 border-emerald-400/20">{a.status}</Badge></TableCell>
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
