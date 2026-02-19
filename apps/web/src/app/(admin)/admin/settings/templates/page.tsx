"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Label, 
  Textarea,
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@schoolerp/ui"
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  MessageCircle,
  Bell,
  RefreshCw,
  Loader2
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface NotificationTemplate {
  id: string
  code: string
  channel: 'email' | 'sms' | 'whatsapp' | 'push'
  locale: string
  subject?: string
  body: string
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  
  const [formData, setFormData] = useState({
    code: "",
    channel: "email",
    locale: "en",
    subject: "",
    body: ""
  })

  const fetchTemplates = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient("/admin/notifications/templates")
      if (res.ok) {
        const data = await res.json()
        setTemplates(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      toast.error("Failed to load templates")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleCreateOrUpdate = async () => {
    if (!formData.code || !formData.body || !formData.channel) {
      toast.error("Code, Body, and Channel are required")
      return
    }

    try {
      let res;
      if (editingTemplate) {
        res = await apiClient(`/admin/notifications/templates/${editingTemplate.id}`, {
          method: "PUT",
          body: JSON.stringify({
            subject: formData.subject,
            body: formData.body
          })
        })
      } else {
        res = await apiClient("/admin/notifications/templates", {
          method: "POST",
          body: JSON.stringify(formData)
        })
      }

      if (res.ok) {
        toast.success(editingTemplate ? "Template updated" : "Template created")
        setIsDialogOpen(false)
        resetForm()
        fetchTemplates(true)
      } else {
        const errorText = await res.text()
        toast.error(errorText || "Failed to save template")
      }
    } catch (err) {
      toast.error("Error saving template")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return
    try {
      const res = await apiClient(`/admin/notifications/templates/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("Template deleted")
        fetchTemplates(true)
      } else {
        toast.error("Failed to delete")
      }
    } catch (err) {
      toast.error("Error deleting template")
    }
  }

  const resetForm = () => {
    setFormData({
      code: "",
      channel: "email",
      locale: "en",
      subject: "",
      body: ""
    })
    setEditingTemplate(null)
  }

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setFormData({
      code: template.code,
      channel: template.channel,
      locale: template.locale,
      subject: template.subject || "",
      body: template.body
    })
    setIsDialogOpen(true)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4 text-primary" />
      case 'sms': return <Smartphone className="w-4 h-4 text-emerald-500" />
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'push': return <Bell className="w-4 h-4 text-amber-500" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const templatesByChannel = (channel: string) => {
    return templates.filter(t => t.channel === channel)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Alerts</h1>
          <p className="text-muted-foreground">Manage your school-wide notification templates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchTemplates(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingTemplate && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Template Code</Label>
                      <Input 
                        placeholder="e.g. FEE_REM_1" 
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Select 
                        value={formData.channel} 
                        onValueChange={(val: any) => setFormData({ ...formData, channel: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="push">Push Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {formData.channel === 'email' && (
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input 
                      placeholder="Enter subject line" 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Message Body</Label>
                  <Textarea 
                    placeholder="Type your message here. Use {{variable}} for dynamic data." 
                    rows={8}
                    className="font-mono text-sm"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Supported tags: {"{{student_name}}, {{parent_name}}, {{amount}}, {{due_date}}"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateOrUpdate}>Save Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <Smartphone className="w-4 h-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="push" className="gap-2">
            <Bell className="w-4 h-4" /> Push
          </TabsTrigger>
        </TabsList>

        {['email', 'sms', 'whatsapp', 'push'].map((channel) => (
          <TabsContent key={channel} value={channel}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Code</TableHead>
                      {channel === 'email' && <TableHead>Subject</TableHead>}
                      <TableHead>Preview</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={channel === 'email' ? 4 : 3} className="h-24 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : templatesByChannel(channel).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={channel === 'email' ? 4 : 3} className="h-24 text-center text-muted-foreground">
                          No {channel} templates found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      templatesByChannel(channel).map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-bold font-mono text-xs">{template.code}</TableCell>
                          {channel === 'email' && (
                            <TableCell className="max-w-[200px] truncate font-medium">
                              {template.subject || 'No Subject'}
                            </TableCell>
                          )}
                          <TableCell className="max-w-[400px] truncate text-muted-foreground text-sm italic">
                            {template.body}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDelete(template.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
