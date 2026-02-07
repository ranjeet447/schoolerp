"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Tabs, TabsContent, TabsList, TabsTrigger
} from "@schoolerp/ui"
import { Plus, GraduationCap, Briefcase, Users } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Alumni {
  id: string
  full_name: string
  graduation_year: number
  current_company: string
  current_role: string
  is_verified: boolean
}

interface PlacementDrive {
  id: string
  company_name: string
  role_title: string
  drive_date: string
  status: string
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [drives, setDrives] = useState<PlacementDrive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [alumniRes, drivesRes] = await Promise.all([
        apiClient("/alumni"),
        apiClient("/alumni/drives")
      ])
      if (alumniRes.ok) setAlumni(await alumniRes.json() || [])
      if (drivesRes.ok) setDrives(await drivesRes.json() || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alumni & Placements</h1>
          <p className="text-muted-foreground">Manage alumni directory and coordinate placement drives.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Alumni
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alumni.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alumni.filter(a => a.is_verified).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Placement Drives</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drives.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alumni" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alumni" className="gap-2">
            <GraduationCap className="w-4 h-4" /> Alumni Directory
          </TabsTrigger>
          <TabsTrigger value="drives" className="gap-2">
            <Briefcase className="w-4 h-4" /> Placement Drives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alumni">
          <Card>
            <CardHeader>
              <CardTitle>Alumni Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : alumni.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No alumni registered yet.</TableCell>
                    </TableRow>
                  ) : (
                    alumni.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.full_name}</TableCell>
                        <TableCell>{a.graduation_year}</TableCell>
                        <TableCell>{a.current_company || "-"}</TableCell>
                        <TableCell>{a.current_role || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={a.is_verified ? "outline" : "secondary"}>
                            {a.is_verified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drives">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Placement Drives</CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> New Drive
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No drives scheduled.</TableCell>
                    </TableRow>
                  ) : (
                    drives.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.company_name}</TableCell>
                        <TableCell>{d.role_title}</TableCell>
                        <TableCell className="text-xs">{d.drive_date || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={d.status === 'completed' ? "outline" : "secondary"}>{d.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
