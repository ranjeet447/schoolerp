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
  Switch,
  Textarea
} from "@schoolerp/ui"
import { 
  Plus, 
  RefreshCw,
  Loader2,
  Settings2,
  CheckCircle2
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface GatewayConfig {
  id: string
  provider: string
  api_key?: string
  api_secret?: string
  sender_id?: string
  is_active: boolean
  settings?: any
}

export default function NotificationGatewaysPage() {
  const [configs, setConfigs] = useState<GatewayConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<GatewayConfig | null>(null)
  
  const [formData, setFormData] = useState({
    provider: "msg91",
    api_key: "",
    api_secret: "",
    sender_id: "",
    is_active: true,
    settings_json: "{}"
  })

  const fetchConfigs = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient("/admin/notifications/gateways")
      if (res.ok) {
        const data = await res.json()
        setConfigs(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      toast.error("Failed to load gateway configs")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const handleSave = async () => {
    if (!formData.provider) {
      toast.error("Provider is required")
      return
    }

    try {
      let parsedSettings = {}
      try {
        parsedSettings = JSON.parse(formData.settings_json || "{}")
      } catch (e) {
        toast.error("Invalid JSON in settings")
        return
      }

      const res = await apiClient("/admin/notifications/gateways", {
        method: "POST",
        body: JSON.stringify({
          provider: formData.provider,
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          sender_id: formData.sender_id,
          is_active: formData.is_active,
          settings: parsedSettings
        })
      })

      if (res.ok) {
        toast.success("Gateway config saved")
        setIsDialogOpen(false)
        resetForm()
        fetchConfigs(true)
      } else {
        const errorText = await res.text()
        toast.error(errorText || "Failed to save gateway")
      }
    } catch (err) {
      toast.error("Error saving gateway config")
    }
  }

  const handleToggleActive = async (provider: string, currentStatus: boolean) => {
    const configToUpdate = configs.find(c => c.provider === provider)
    if (!configToUpdate) return

    try {
      const res = await apiClient("/admin/notifications/gateways", {
        method: "POST",
        body: JSON.stringify({
          provider: configToUpdate.provider,
          api_key: configToUpdate.api_key || "",
          api_secret: configToUpdate.api_secret || "",
          sender_id: configToUpdate.sender_id || "",
          is_active: !currentStatus,
          settings: configToUpdate.settings || {}
        })
      })

      if (res.ok) {
        toast.success(currentStatus ? "Gateway disabled" : "Gateway activated")
        fetchConfigs(true)
      } else {
        toast.error("Failed to toggle gateway status")
      }
    } catch (err) {
      toast.error("Error toggling gateway")
    }
  }

  const resetForm = () => {
    setFormData({
      provider: "msg91",
      api_key: "",
      api_secret: "",
      sender_id: "",
      is_active: true,
      settings_json: "{\n  \"rate_per_sms\": 0.25,\n  \"whatsapp_rate\": 0.80\n}"
    })
    setEditingConfig(null)
  }


  const handleEdit = (config: GatewayConfig) => {
    setEditingConfig(config)
    setFormData({
      provider: config.provider,
      api_key: config.api_key || "",
      api_secret: config.api_secret || "",
      sender_id: config.sender_id || "",
      is_active: config.is_active,
      settings_json: config.settings ? JSON.stringify(config.settings, null, 2) : "{}"
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messaging Gateways</h1>
          <p className="text-muted-foreground">Configure dynamic SMS and WhatsApp providers (e.g. MSG91, Twilio).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchConfigs(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Gateway
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingConfig ? 'Edit Gateway' : 'Add New Gateway'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select 
                      value={formData.provider} 
                      onValueChange={(val: string) => setFormData({ ...formData, provider: val })}
                      disabled={!!editingConfig}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="msg91">MSG91</SelectItem>
                        <SelectItem value="smshorizon">SMSHorizon</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="gupshup">Gupshup</SelectItem>
                        <SelectItem value="aws_sns">AWS SNS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Label>Is Active?</Label>
                      <Switch 
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input 
                    type="password"
                    placeholder="Enter API Key / Auth Key" 
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>API Secret / Username</Label>
                    <Input 
                      type="password"
                      placeholder="Optional for some providers" 
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sender ID</Label>
                    <Input 
                      placeholder="e.g. SCHERP" 
                      value={formData.sender_id}
                      onChange={(e) => setFormData({ ...formData, sender_id: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Advanced Settings (JSON)</Label>
                  <Textarea 
                    placeholder="{}" 
                    rows={4}
                    className="font-mono text-sm"
                    value={formData.settings_json}
                    onChange={(e) => setFormData({ ...formData, settings_json: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Example: {"{\"rate_per_sms\": 0.25, \"whatsapp_rate\": 0.80}"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Gateway</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Sender ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No gateway configurations found. Click "Add Gateway" to set one up.
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-bold flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{config.provider}</span>
                      {config.is_active && <Badge variant="default" className="ml-2 h-5 bg-emerald-500 hover:bg-emerald-600">Active</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {config.sender_id || '-'}
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={config.is_active}
                        onCheckedChange={() => handleToggleActive(config.provider, config.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                        Configure
                      </Button>
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
