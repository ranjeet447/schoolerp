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
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Staff Task Master</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Assign and track operational tasks across departments.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Assign New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input 
                  placeholder="e.g., Update Inventory Records" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Details about the task..." 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={v => setNewTask({...newTask, priority: v})}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={newTask.due_date}
                    onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={newTask.assigned_to} onValueChange={v => setNewTask({...newTask, assigned_to: v})}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                        {employees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Assign Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active", count: tasks.filter((t:any) => t.status !== 'completed').length, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-400/10" },
          { label: "Completed", count: tasks.filter((t:any) => t.status === 'completed').length, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-400/10" },
          { label: "Urgent", count: tasks.filter((t:any) => t.priority === 'urgent').length, icon: AlertCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-400/10" },
          { label: "Total", count: tasks.length, icon: User, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 text-foreground`}>{stat.count}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-muted-foreground font-bold">Task</TableHead>
              <TableHead className="text-muted-foreground font-bold">Assigned To</TableHead>
              <TableHead className="text-muted-foreground font-bold">Priority</TableHead>
              <TableHead className="text-muted-foreground font-bold">Due Date</TableHead>
              <TableHead className="text-muted-foreground font-bold">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                        <p className="text-muted-foreground font-medium">Loading tasks...</p>
                    </TableCell>
                </TableRow>
            ) : tasks.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                        <p className="text-muted-foreground font-medium">No tasks assigned yet.</p>
                    </TableCell>
                </TableRow>
            ) : tasks.map((task: any) => (
              <TableRow key={task.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground font-medium truncate max-w-xs">{task.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{task.assigned_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-foreground text-sm font-medium">{task.assigned_name || 'Unassigned'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`
                    ${task.priority === 'urgent' ? 'text-rose-600 border-rose-600/20 bg-rose-600/10 dark:text-rose-400 dark:border-rose-400/20 dark:bg-rose-400/10' : 
                      task.priority === 'high' ? 'text-amber-600 border-amber-600/20 bg-amber-600/10 dark:text-amber-400 dark:border-amber-400/20 dark:bg-amber-400/10' :
                      'text-indigo-600 border-indigo-600/20 bg-indigo-600/10 dark:text-indigo-400 dark:border-indigo-400/20 dark:bg-indigo-400/10'}
                  `}>
                    {task.priority.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={task.status === 'completed' ? 'bg-emerald-500 text-white' : task.status === 'in_progress' ? 'bg-amber-500 text-white' : 'bg-muted text-foreground'}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors text-primary">
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
