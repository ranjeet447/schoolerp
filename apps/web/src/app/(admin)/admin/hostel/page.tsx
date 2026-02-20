"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bed,
  UserPlus,
  Building,
  Shield,
  RefreshCw,
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
  TableRow,
} from "@schoolerp/ui";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

type HostelBuilding = {
  id: string;
  name: string;
  type: string;
  address?: string;
  warden_id?: string;
  total_rooms?: number;
  is_active?: boolean;
};

type HostelRoom = {
  id: string;
  building_id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  occupancy: number;
};

type HostelAllocation = {
  id: string;
  room_id: string;
  student_id: string;
  student_name?: string;
  room_number?: string;
  building_name?: string;
  allotted_on?: string;
  status: string;
};

export default function HostelPage() {
  const [activeTab, setActiveTab] = useState("buildings");
  const [buildings, setBuildings] = useState<HostelBuilding[]>([]);
  const [roomsByBuilding, setRoomsByBuilding] = useState<Record<string, HostelRoom[]>>({});
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHostelData = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [buildingsRes, allocationsRes] = await Promise.all([
        apiClient("/admin/hostel/buildings"),
        apiClient("/admin/hostel/allocations"),
      ]);

      const buildingRows = buildingsRes.ok ? await buildingsRes.json() : [];
      const buildingsList = Array.isArray(buildingRows) ? buildingRows : [];
      setBuildings(buildingsList);

      const roomPairs = await Promise.all(
        buildingsList.map(async (building: HostelBuilding) => {
          const res = await apiClient(`/admin/hostel/buildings/${building.id}/rooms`);
          const rows = res.ok ? await res.json() : [];
          return [building.id, Array.isArray(rows) ? rows : []] as const;
        }),
      );
      setRoomsByBuilding(Object.fromEntries(roomPairs));

      const allocationRows = allocationsRes.ok ? await allocationsRes.json() : [];
      setAllocations(Array.isArray(allocationRows) ? allocationRows : []);
    } catch (err) {
      toast.error("Failed to load hostel data.");
      setBuildings([]);
      setRoomsByBuilding({});
      setAllocations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchHostelData(false);
  }, []);

  const allRooms = useMemo(() => Object.values(roomsByBuilding).flat(), [roomsByBuilding]);

  const summary = useMemo(() => {
    const totalCapacity = allRooms.reduce((sum, room) => sum + (Number(room.capacity) || 0), 0);
    const totalOccupants = allRooms.reduce((sum, room) => sum + (Number(room.occupancy) || 0), 0);
    return {
      totalOccupants,
      totalCapacity,
      availableBeds: Math.max(0, totalCapacity - totalOccupants),
      totalBuildings: buildings.length,
      totalAllocations: allocations.length,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0,
    };
  }, [allRooms, buildings.length, allocations.length]);

  const filteredAllocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allocations;
    return allocations.filter((a) =>
      [a.student_name, a.room_number, a.building_name, a.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [allocations, search]);

  const handleVacate = async (allocationID: string) => {
    try {
      const res = await apiClient(`/admin/hostel/allocations/${allocationID}/vacate`, { method: "POST" });
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to vacate room");
      }
      toast.success("Room vacated");
      await fetchHostelData(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to vacate room");
    }
  };

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
          <Button variant="outline" className="border-slate-800 bg-slate-900/50" onClick={() => void fetchHostelData(true)} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          {activeTab === "allocations" ? (
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              <UserPlus className="mr-2 h-4 w-4" /> New Allocation
            </Button>
          ) : (
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              <Building className="mr-2 h-4 w-4" /> Add Building
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Occupants</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{summary.totalOccupants}</span>
              <span className="text-emerald-500 text-xs mb-1 font-medium">{summary.occupancyRate}% occupancy</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Available Beds</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{summary.availableBeds}</span>
              <span className="text-slate-500 text-xs mb-1 font-medium">Out of {summary.totalCapacity}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Buildings</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{summary.totalBuildings}</span>
              <span className="text-slate-500 text-xs mb-1 font-medium">{allRooms.length} rooms mapped</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Allocations</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold">{summary.totalAllocations}</span>
              <span className="text-amber-500 text-xs mb-1 font-medium">Live from API</span>
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
          {loading ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-400">Loading buildings...</Card>
          ) : buildings.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-400">No hostel buildings found.</Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {buildings.map((building) => {
                const rooms = roomsByBuilding[building.id] || [];
                const occupancy = rooms.reduce((sum, room) => sum + (Number(room.occupancy) || 0), 0);
                const capacity = rooms.reduce((sum, room) => sum + (Number(room.capacity) || 0), 0);
                const occupancyPct = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
                return (
                  <Card key={building.id} className="bg-slate-900 border-slate-800 overflow-hidden group">
                    <div className="h-2 bg-emerald-500" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-xl font-bold">{building.name}</CardTitle>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border",
                            (building.type || "").toLowerCase().includes("boy")
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-pink-500/10 text-pink-400 border-pink-500/20",
                          )}
                        >
                          {building.type || "N/A"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Occupancy</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{occupancy}/{capacity}</span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, occupancyPct))}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Warden</span>
                          <span className="text-slate-300 font-medium">
                            {building.warden_id ? building.warden_id.slice(0, 8) : "Not assigned"}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">Rooms: {rooms.length} • Address: {building.address || "N/A"}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="allocations">
          <Card className="bg-slate-900 border-slate-800">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="relative w-72">
                <Input
                  placeholder="Search student, room, building..."
                  className="bg-slate-950 border-slate-800 pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Bed className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
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
                {loading ? (
                  <TableRow className="border-slate-800">
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">Loading allocations...</TableCell>
                  </TableRow>
                ) : filteredAllocations.length === 0 ? (
                  <TableRow className="border-slate-800">
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">No matching allocations found.</TableCell>
                  </TableRow>
                ) : (
                  filteredAllocations.map((al) => (
                    <TableRow key={al.id} className="border-slate-800 hover:bg-slate-950/50">
                      <TableCell className="font-medium text-slate-200">{al.student_name || al.student_id}</TableCell>
                      <TableCell className="font-medium text-slate-300">{al.room_number || "N/A"}</TableCell>
                      <TableCell className="text-slate-400">{al.building_name || "N/A"}</TableCell>
                      <TableCell className="text-slate-400">{al.allotted_on || "-"}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                          {al.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => void handleVacate(al.id)}>
                          Vacate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="bg-slate-900 border-slate-800 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Hostel Health Overview</h3>
                <p className="text-slate-400 max-w-md mt-1 mx-auto">
                  Occupancy is {summary.occupancyRate}% across {summary.totalBuildings} buildings. Use this view for capacity checks while maintenance APIs are being integrated.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
