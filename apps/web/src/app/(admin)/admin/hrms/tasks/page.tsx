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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Avatar,
  AvatarFallback,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@schoolerp/ui"
import { Plus, CheckCircle2, Clock, AlertCircle, User, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigned_to: "",
    due_date: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [tasksRes, empRes] = await Promise.all([
      apiClient("/hrms/staff/tasks"),
      apiClient("/hrms/employees?limit=100")
    ])

    if (tasksRes.ok) setTasks(await tasksRes.json())
    if (empRes.ok) setEmployees(await empRes.json())
    setLoading(false)
  }

  const handleCreate = async () => {
    const res = await apiClient("/hrms/staff/tasks", {
      method: "POST",
      body: JSON.stringify({
        ...newTask,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null
      })
    })

    if (res.ok) {
      toast.success("Task assigned successfully")
      setIsAdding(false)
      fetchData()
    } else {
      toast.error("Failed to assign task")
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Staff Task Master</h1>
          <p className="text-slate-400 font-medium">Assign and track operational tasks across departments.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl font-bold gap-2">
              <Plus className="h-5 w-5" /> Assign New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Assign New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input 
                  placeholder="e.g., Update Inventory Records" 
                  className="bg-slate-800 border-white/5"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Details about the task..." 
                  className="bg-slate-800 border-white/5"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={v => setNewTask({...newTask, priority: v})}>
                    <SelectTrigger className="bg-slate-800 border-white/5">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input 
                    type="date"
                    className="bg-slate-800 border-white/5"
                    value={newTask.due_date}
                    onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={newTask.assigned_to} onValueChange={v => setNewTask({...newTask, assigned_to: v})}>
                    <SelectTrigger className="bg-slate-800 border-white/5">
                        <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 mt-4 font-bold">
                Assign Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active", count: tasks.filter((t:any) => t.status !== 'completed').length, icon: Clock, color: "text-amber-400" },
          { label: "Completed", count: tasks.filter((t:any) => t.status === 'completed').length, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Urgent", count: tasks.filter((t:any) => t.priority === 'urgent').length, icon: AlertCircle, color: "text-rose-400" },
          { label: "Total", count: tasks.length, icon: User, color: "text-indigo-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-slate-900/50 border-white/5 rounded-3xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
              </div>
              <stat.icon className={`h-8 w-8 opacity-20 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-slate-400">Task</TableHead>
              <TableHead className="text-slate-400">Assigned To</TableHead>
              <TableHead className="text-slate-400">Priority</TableHead>
              <TableHead className="text-slate-400">Due Date</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 opacity-50" />
                        <p className="mt-4 text-slate-500">Loading tasks...</p>
                    </TableCell>
                </TableRow>
            ) : tasks.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                        <p className="text-slate-500">No tasks assigned yet.</p>
                    </TableCell>
                </TableRow>
            ) : tasks.map((task: any) => (
              <TableRow key={task.id} className="hover:bg-white/5 border-white/5 transition-colors">
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-bold text-white">{task.title}</p>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{task.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-white/10">
                        <AvatarFallback className="text-[10px] bg-slate-800">{task.assigned_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-slate-300 text-sm font-medium">{task.assigned_name || 'Unassigned'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`
                    ${task.priority === 'urgent' ? 'text-rose-400 border-rose-400/20 bg-rose-400/5' : 
                      task.priority === 'high' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' :
                      'text-indigo-400 border-indigo-400/20 bg-indigo-400/5'}
                  `}>
                    {task.priority.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Calendar className="h-3 w-3" />
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-700'}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
