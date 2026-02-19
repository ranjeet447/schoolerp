"use client";

import { useState } from "react";
import { 
  Plus,
  Home,
  Bed,
  UserPlus,
  LogOut,
  Building,
  Info,
  MapPin,
  Shield,
  Coffee,
  Wifi,
  Wind
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@schoolerp/ui";
import { cn } from "@/lib/utils";

export default function HostelPage() {
  const [activeTab, setActiveTab] = useState("buildings");

  const buildings = [
    { id: "1", name: "Boys Hostel Block A", type: "Boys", rooms: 45, occupancy: 120, capacity: 150, warden: "John Doe" },
    { id: "2", name: "Girls Hostel Block B", type: "Girls", rooms: 30, occupancy: 85, capacity: 100, warden: "Jane Smith" },
  ];

  const allocations = [
    { id: "1", student: "Aravind Kumar", roll: "2024001", building: "Boys Hostel Block A", room: "A-101", date: "2024-01-15", status: "Active" },
    { id: "2", student: "Sneha Reddy", roll: "2024045", building: "Girls Hostel Block B", room: "B-205", date: "2024-01-20", status: "Active" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Hostel Management
          </h1>
          <p className="text-slate-400 mt-1">Manage buildings, rooms, and student allocations.</p>
        </div>

        <div className="flex gap-2">
          {activeTab === "buildings" ? (
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              <Building className="mr-2 h-4 w-4" /> Add Building
            </Button>
          ) : (
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              <UserPlus className="mr-2 h-4 w-4" /> New Allocation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Occupants</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">205</span>
              <span className="text-emerald-500 text-xs mb-1 font-medium">+5 this week</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Available Beds</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">45</span>
              <span className="text-slate-500 text-xs mb-1 font-medium">Out of 250</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Buildings</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">4</span>
              <span className="text-slate-500 text-xs mb-1 font-medium">1 unisex block</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Revenue / Mo</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">₹8.4L</span>
              <span className="text-amber-500 text-xs mb-1 font-medium">₹1.2L pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="buildings" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border-slate-800 mb-4 h-12">
          <TabsTrigger value="buildings" className="data-[state=active]:bg-slate-800 px-6">Buildings & Rooms</TabsTrigger>
          <TabsTrigger value="allocations" className="data-[state=active]:bg-slate-800 px-6">Allocations</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-slate-800 px-6">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="buildings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {buildings.map(building => (
              <Card key={building.id} className="bg-slate-900 border-slate-800 overflow-hidden group">
                <div className="h-2 bg-emerald-500" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{building.name}</CardTitle>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border",
                      building.type === "Boys" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-pink-500/10 text-pink-400 border-pink-500/20"
                    )}>
                      {building.type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Occupancy</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{building.occupancy}/{building.capacity}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${(building.occupancy/building.capacity)*100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Warden</span>
                      <span className="text-slate-300 font-medium">{building.warden}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-slate-800 hover:bg-slate-800">View Rooms</Button>
                    <Button variant="outline" className="flex-1 border-slate-800 hover:bg-slate-800">Edit Building</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="allocations">
          <Card className="bg-slate-900 border-slate-800">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center">
               <div className="relative w-72">
                 <Input placeholder="Search students..." className="bg-slate-950 border-slate-800 pl-10" />
                 <Bed className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
               </div>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="border-slate-800">Filter</Button>
                 <Button variant="outline" size="sm" className="border-slate-800">Export</Button>
               </div>
             </div>
             <Table>
               <TableHeader>
                 <TableRow className="border-slate-800 hover:bg-transparent">
                   <TableHead className="text-slate-400">Student</TableHead>
                   <TableHead className="text-slate-400">Room</TableHead>
                   <TableHead className="text-slate-400">Building</TableHead>
                   <TableHead className="text-slate-400">Allotted On</TableHead>
                   <TableHead className="text-slate-400">Status</TableHead>
                   <TableHead className="text-right text-slate-400">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {allocations.map(al => (
                   <TableRow key={al.id} className="border-slate-800 hover:bg-slate-950/50">
                     <TableCell>
                       <div>
                         <div className="font-medium text-slate-200">{al.student}</div>
                         <div className="text-xs text-slate-500">{al.roll}</div>
                       </div>
                     </TableCell>
                     <TableCell className="font-medium text-slate-300">{al.room}</TableCell>
                     <TableCell className="text-slate-400">{al.building}</TableCell>
                     <TableCell className="text-slate-400">{al.date}</TableCell>
                     <TableCell>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                          {al.status}
                        </span>
                     </TableCell>
                     <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Vacate</Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance">
           <Card className="bg-slate-900 border-slate-800 p-12 text-center">
             <div className="flex flex-col items-center gap-4">
               <div className="h-16 w-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                 <Shield className="h-8 w-8 text-amber-500" />
               </div>
               <div>
                 <h3 className="text-xl font-bold">No Pending Requests</h3>
                 <p className="text-slate-400 max-w-sm mt-1 mx-auto">All room maintenance and security reports are currently up to date.</p>
               </div>
               <Button variant="outline" className="mt-2 border-slate-800">Check History</Button>
             </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
