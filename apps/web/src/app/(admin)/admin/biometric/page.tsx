"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@schoolerp/ui"
import { apiClient, asArrayPayload } from "@/lib/api-client"
import { toast } from "sonner"
import { Fingerprint, Wifi, WifiOff, RefreshCw, Activity } from "lucide-react"

type DeviceStatus = {
  device_id: string
  last_seen: string
  total_today: number
  status: "online" | "offline"
}

type LogRow = {
  id: string
  device_id: string
  raw_identifier: string
  entity_type: string
  entity_name: string
  direction: string
  logged_at: string
}

export default function BiometricDeviceSyncPage() {
  const [devices, setDevices] = useState<DeviceStatus[]>([])
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const [devRes, logRes] = await Promise.all([
        apiClient("/admin/biometric/devices"),
        apiClient("/admin/biometric/logs")
      ])
      if (devRes.ok) setDevices(asArrayPayload(await devRes.json()))
      if (logRes.ok) setLogs(asArrayPayload(await logRes.json()))
    } catch (err) {
      toast.error("Failed to load biometric data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const onlineCount = devices.filter(d => d.status === "online").length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-primary" />
            Biometric Device Sync
          </h1>
          <p className="text-muted-foreground mt-1">Monitor device connectivity and attendance punch logs</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadData(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/30">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Devices</p>
              <p className="text-2xl font-bold">{devices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl dark:bg-green-900/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Online</p>
              <p className="text-2xl font-bold">{onlineCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl dark:bg-red-900/30">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Offline</p>
              <p className="text-2xl font-bold">{devices.length - onlineCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl dark:bg-purple-900/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Punches Today</p>
              <p className="text-2xl font-bold">{devices.reduce((acc, d) => acc + d.total_today, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle>Registered Devices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead className="text-right">Today&apos;s Punches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No biometric devices registered yet. Connect a device to start syncing.
                  </TableCell>
                </TableRow>
              ) : (
                devices.map(d => (
                  <TableRow key={d.device_id}>
                    <TableCell className="font-mono font-medium">{d.device_id}</TableCell>
                    <TableCell>
                      {d.status === "online" ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">● Online</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">● Offline</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(d.last_seen).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">{d.total_today}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle>Recent Punch Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Direction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No punch logs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground">{new Date(l.logged_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{l.device_id}</TableCell>
                    <TableCell className="font-medium">{l.entity_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">{l.entity_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.direction === "in" ? "default" : "secondary"} className="text-xs capitalize">
                        {l.direction}
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
