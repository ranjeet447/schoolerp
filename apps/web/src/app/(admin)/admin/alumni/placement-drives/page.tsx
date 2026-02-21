"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Plus, Briefcase } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface PlacementDrive {
  id: string
  company_name: string
  role_title: string
  drive_date: string
  status: string
}

export default function PlacementDrivesPage() {
  const [drives, setDrives] = useState<PlacementDrive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/alumni/drives")
      if (res.ok) setDrives(await res.json() || [])
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
          <h1 className="text-3xl font-bold tracking-tight">Placement Drives</h1>
          <p className="text-muted-foreground">Coordinate and manage placement drives for students and alumni.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Drive
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Placement Drives Directory</CardTitle>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : drives.length === 0 ? (
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
    </div>
  )
}
