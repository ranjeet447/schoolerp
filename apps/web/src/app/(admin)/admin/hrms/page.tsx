"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Tabs, TabsContent, TabsList, TabsTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@schoolerp/ui"
import { Plus, Users, DollarSign, Calendar, Building2, RefreshCw, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Employee {
  id: string
  employee_code: string
  full_name: string
  email: string
  department: string
  designation: string
  status: string
}

interface PayrollRun {
  id: string
  month: number
  year: number
  status: string
  run_at: string
}

interface SalaryStructure {
  id: string
  name: string
}

export default function HRMSPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [submittingEmployee, setSubmittingEmployee] = useState(false)
  const [submittingPayroll, setSubmittingPayroll] = useState(false)
  const [executingPayrollID, setExecutingPayrollID] = useState("")

  const [employeeForm, setEmployeeForm] = useState({
    employee_code: "",
    full_name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    salary_structure_id: "",
  })

  const [payrollForm, setPayrollForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  })

  useEffect(() => {
    fetchData(false)
  }, [])

  const fetchData = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const [empRes, prRes, salaryRes] = await Promise.all([
        apiClient("/admin/hrms/employees"),
        apiClient("/admin/hrms/payroll-runs"),
        apiClient("/admin/hrms/salary-structures"),
      ])

      if (!empRes.ok) throw new Error(await empRes.text() || "Failed to load employees")
      if (!prRes.ok) throw new Error(await prRes.text() || "Failed to load payroll runs")

      setEmployees(await empRes.json() || [])
      setPayrollRuns(await prRes.json() || [])

      if (salaryRes.ok) {
        setSalaryStructures(await salaryRes.json() || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load HRMS data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingEmployee(true)
    setError("")
    try {
      const res = await apiClient("/admin/hrms/employees", {
        method: "POST",
        body: JSON.stringify(employeeForm),
      })
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to create employee")
      }
      setShowEmployeeModal(false)
      setEmployeeForm({
        employee_code: "",
        full_name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        salary_structure_id: "",
      })
      await fetchData(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee")
    } finally {
      setSubmittingEmployee(false)
    }
  }

  const handleCreatePayrollRun = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingPayroll(true)
    setError("")
    try {
      const res = await apiClient("/admin/hrms/payroll-runs", {
        method: "POST",
        body: JSON.stringify({ month: Number(payrollForm.month), year: Number(payrollForm.year) }),
      })
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to create payroll run")
      }
      setShowPayrollModal(false)
      await fetchData(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payroll run")
    } finally {
      setSubmittingPayroll(false)
    }
  }

  const handleExecutePayroll = async (payrollID: string) => {
    setExecutingPayrollID(payrollID)
    setError("")
    try {
      const res = await apiClient(`/admin/hrms/payroll-runs/${payrollID}/execute`, { method: "POST" })
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to execute payroll")
      }
      await fetchData(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute payroll")
    } finally {
      setExecutingPayrollID("")
    }
  }

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HRMS & Payroll</h1>
          <p className="text-muted-foreground">Manage employees, salary structures, and payroll.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button className="gap-2" onClick={() => setShowEmployeeModal(true)}>
          <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Runs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRuns.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="w-4 h-4" /> Employees
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Calendar className="w-4 h-4" /> Payroll History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No employees found.</TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.department || "-"}</TableCell>
                        <TableCell>{emp.designation || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={emp.status === 'active' ? "outline" : "secondary"}>{emp.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payroll Runs</CardTitle>
              <Button size="sm" className="gap-2" onClick={() => setShowPayrollModal(true)}>
                <Plus className="w-4 h-4" /> Run Payroll
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Run At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payroll runs yet.</TableCell>
                    </TableRow>
                  ) : (
                    payrollRuns.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell className="font-medium">{monthNames[pr.month]} {pr.year}</TableCell>
                        <TableCell>
                          <Badge variant={pr.status === 'completed' ? "outline" : "secondary"}>{pr.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{pr.run_at || "-"}</TableCell>
                        <TableCell className="text-right">
                          {pr.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={executingPayrollID === pr.id}
                              onClick={() => handleExecutePayroll(pr.id)}
                            >
                              {executingPayrollID === pr.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute"}
                            </Button>
                          )}
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

      <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Create an employee record and optionally attach a salary structure.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Employee Code" value={employeeForm.employee_code} onChange={(e) => setEmployeeForm((p) => ({ ...p, employee_code: e.target.value }))} required />
              <Input placeholder="Full Name" value={employeeForm.full_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, full_name: e.target.value }))} required />
              <Input placeholder="Email" type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} required />
              <Input placeholder="Phone" value={employeeForm.phone} onChange={(e) => setEmployeeForm((p) => ({ ...p, phone: e.target.value }))} />
              <Input placeholder="Department" value={employeeForm.department} onChange={(e) => setEmployeeForm((p) => ({ ...p, department: e.target.value }))} />
              <Input placeholder="Designation" value={employeeForm.designation} onChange={(e) => setEmployeeForm((p) => ({ ...p, designation: e.target.value }))} />
            </div>

            <Select
              value={employeeForm.salary_structure_id || undefined}
              onValueChange={(value) => setEmployeeForm((p) => ({ ...p, salary_structure_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select salary structure (optional)" />
              </SelectTrigger>
              <SelectContent>
                {salaryStructures.map((salary) => (
                  <SelectItem key={salary.id} value={salary.id}>{salary.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEmployeeModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingEmployee}>{submittingEmployee ? "Saving..." : "Create Employee"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayrollModal} onOpenChange={setShowPayrollModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payroll Run</DialogTitle>
            <DialogDescription>Generate a payroll run for a given month and year.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePayrollRun} className="space-y-3">
            <div className="grid gap-3 grid-cols-2">
              <Input placeholder="Month (1-12)" value={payrollForm.month} onChange={(e) => setPayrollForm((p) => ({ ...p, month: e.target.value }))} required />
              <Input placeholder="Year" value={payrollForm.year} onChange={(e) => setPayrollForm((p) => ({ ...p, year: e.target.value }))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPayrollModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingPayroll}>{submittingPayroll ? "Creating..." : "Create Run"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
