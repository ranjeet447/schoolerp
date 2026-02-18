"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Plus, Building2, Users, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface SchoolGroup {
  id: string
  name: string
  description: string
}

interface GroupAnalytics {
  total_students: number
  total_employees: number
}

export default function PortfolioPage() {
  const [groups, setGroups] = useState<SchoolGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<SchoolGroup | null>(null)
  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/portfolio/groups")
      if (res.ok) {
        const data = await res.json() || []
        setGroups(data)
        if (data.length > 0) {
          setSelectedGroup(data[0])
          fetchAnalytics(data[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (groupId: string) => {
    try {
      const res = await apiClient(`/admin/portfolio/groups/${groupId}/analytics`)
      if (res.ok) {
        setAnalytics(await res.json())
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
          <p className="text-muted-foreground">Multi-school group analytics and management.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Create Group
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">School Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups created yet.</p>
            ) : (
              groups.map(g => (
                <Button 
                  key={g.id} 
                  onClick={() => { setSelectedGroup(g); fetchAnalytics(g.id); }}
                  variant="ghost"
                  className={`h-auto w-full justify-start rounded-lg border p-3 text-left transition-colors ${
                    selectedGroup?.id === g.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">{g.name}</span>
                  </div>
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          {selectedGroup && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
                <Badge variant="outline">Active</Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics?.total_students || 0}</div>
                    <p className="text-xs text-muted-foreground">Across all member schools</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analytics?.total_employees || 0}</div>
                    <p className="text-xs text-muted-foreground">Staff across all schools</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Member Schools</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Member school list will appear here once loaded.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
