"use client"

import { useState, useEffect } from "react"
import { 
  Button, 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  Label
} from "@schoolerp/ui"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface EmployeeFormProps {
  onSuccess: () => void
}

type SalaryStructure = {
  id: string
  name: string
}

export function EmployeeForm({ onSuccess }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false)
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  
  const [formData, setFormData] = useState({
    employee_code: "",
    full_name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    join_date: "",
    salary_structure_id: ""
  })

  useEffect(() => {
    fetchStructures()
  }, [])

  const fetchStructures = async () => {
    const res = await apiClient("/hrms/salary-structures")
    if (res.ok) setStructures(await res.json())
  }

  const handleSubmit = async () => {
    if (!formData.employee_code || !formData.full_name || !formData.email) {
      toast.error("Please fill all required fields")
      return
    }

    setLoading(true)
    try {
      const res = await apiClient("/hrms/employees", {
        method: "POST",
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success("Employee onboarded successfully")
        onSuccess()
      } else {
        const error = await res.text()
        toast.error(error)
      }
    } catch (error) {
      toast.error("Failed to create employee")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employee Code <span className="text-red-400">*</span></Label>
          <Input 
            placeholder="EMP-001" 
            value={formData.employee_code}
            onChange={e => setFormData({...formData, employee_code: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Full Name <span className="text-red-400">*</span></Label>
          <Input 
            placeholder="John Doe" 
            value={formData.full_name}
            onChange={e => setFormData({...formData, full_name: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Email <span className="text-red-400">*</span></Label>
          <Input 
            type="email"
            placeholder="john@school.com" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input 
            placeholder="+91 9876543210" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select 
            value={formData.department} 
            onValueChange={v => setFormData({...formData, department: v})}
          >
            <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Teaching">Teaching</SelectItem>
              <SelectItem value="Administration">Administration</SelectItem>
              <SelectItem value="Support">Support Staff</SelectItem>
              <SelectItem value="Transport">Transport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Designation</Label>
          <Input 
            placeholder="e.g. Senior Teacher" 
            value={formData.designation}
            onChange={e => setFormData({...formData, designation: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Date of Joining</Label>
          <Input 
            type="date"
            value={formData.join_date}
            onChange={e => setFormData({...formData, join_date: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Salary Structure</Label>
          <Select 
            value={formData.salary_structure_id} 
            onValueChange={v => setFormData({...formData, salary_structure_id: v})}
          >
            <SelectTrigger><SelectValue placeholder="Select Structure" /></SelectTrigger>
            <SelectContent>
              {structures.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
        <Save className="h-4 w-4 mr-2" />
        {loading ? "Onboarding..." : "Onboard Employee"}
      </Button>
    </div>
  )
}
