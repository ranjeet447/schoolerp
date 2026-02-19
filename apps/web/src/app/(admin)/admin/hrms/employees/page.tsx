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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Employee Directory</h1>
          <p className="text-slate-400 font-medium">Manage staff, teachers, and support personnel.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-500">
                <Plus className="h-4 w-4 mr-2" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
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
      <div className="flex flex-wrap gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        <div className="w-full md:w-64 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search name or ID..." 
            className="pl-9 bg-slate-800/50 border-white/10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
           <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="bg-slate-800/50 border-white/10">
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
      </div>

      {/* List */}
      <div className="grid gap-4">
        {loading ? (
           <div className="text-center py-20 text-slate-500">Loading directory...</div>
        ) : filteredEmployees.length === 0 ? (
           <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 opacity-50" />
             </div>
             <p>No employees found matching criteria.</p>
           </div>
        ) : (
          <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarFallback className="bg-indigo-500/20 text-indigo-300 font-bold">
                                {emp.full_name.substring(0,2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-white">{emp.full_name}</p>
                            <p className="text-xs text-slate-400">{emp.employee_code} • {emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                            {emp.department}
                        </Badge>
                    </td>
                    <td className="px-6 py-4">
                        <div className="space-y-1">
                            <div className="flex items-center text-xs text-slate-400">
                                <Mail className="h-3 w-3 mr-2" /> {emp.email}
                            </div>
                            <div className="flex items-center text-xs text-slate-400">
                                <Phone className="h-3 w-3 mr-2" /> {emp.phone}
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="outline" className={emp.status === 'active' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-slate-400'}>
                            {emp.status}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-white">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
