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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
  Avatar,
  AvatarFallback
} from "@schoolerp/ui"
import { Plus, Search, Filter, Phone, Mail, MapPin } from "lucide-react"
import { EmployeeForm } from "./_components/employee-form"
import Link from "next/link"

type Employee = {
  id: string
  employee_code: string
  full_name: string
  email: string
  phone: string
  department: string
  designation: string
  status: string
  join_date: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  
  // Filters
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    const res = await apiClient("/hrms/employees?limit=100")
    if (res.ok) {
      setEmployees(await res.json())
    }
    setLoading(false)
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          emp.employee_code.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === "all" || emp.department === deptFilter
    return matchesSearch && matchesDept
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage staff, teachers, and support personnel.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Onboard New Employee</DialogTitle>
              </DialogHeader>
              <EmployeeForm 
                onSuccess={() => {
                  setOpen(false)
                  fetchEmployees()
                 }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <div className="w-full md:w-64 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search name or ID..." 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
             <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Teaching">Teaching</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
              </SelectContent>
             </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid gap-4">
        {loading ? (
          <Card className="border-none shadow-sm p-12 text-center text-muted-foreground font-medium">Loading directory...</Card>
        ) : filteredEmployees.length === 0 ? (
          <Card className="border-none shadow-sm p-12 text-center bg-muted/20 border-dashed">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold">No employees found matching criteria.</p>
          </Card>
        ) : (
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {emp.full_name.substring(0,2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-foreground">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground font-medium">{emp.employee_code} • {emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-muted text-foreground">
                            {emp.department}
                        </Badge>
                    </td>
                    <td className="px-6 py-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center text-xs font-medium text-muted-foreground">
                                <Mail className="h-3 w-3 mr-2" /> {emp.email}
                            </div>
                            <div className="flex items-center text-xs font-medium text-muted-foreground">
                                <Phone className="h-3 w-3 mr-2" /> {emp.phone}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="outline" className={emp.status === 'active' ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-400' : 'text-muted-foreground'}>
                            {emp.status}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
