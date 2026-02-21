"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Plus, GraduationCap, Users } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Alumni {
  id: string
  full_name: string
  graduation_year: number
  current_company: string
  current_role: string
  is_verified: boolean
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/alumni")
      if (res.ok) setAlumni(await res.json() || [])
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
          <h1 className="text-3xl font-bold tracking-tight">Alumni Directory</h1>
          <p className="text-muted-foreground">Manage alumni directory and track their verification status.</p>
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
      </div>

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
    </div>
  )
}
