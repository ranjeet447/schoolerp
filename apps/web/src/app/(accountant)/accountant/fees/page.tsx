"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  FeePlanBuilder, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge,
  Input,
  Label
} from "@schoolerp/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@schoolerp/ui"
import { toast } from "sonner"

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const intValue = (value: unknown) => {
  if (typeof value === "number") return value
  if (value && typeof value === "object" && "Int32" in value) {
    return Number((value as { Int32?: number }).Int32 || 0)
  }
  return 0
}

const boolValue = (value: unknown) => {
  if (typeof value === "boolean") return value
  if (value && typeof value === "object" && "Bool" in value) {
    return Boolean((value as { Bool?: boolean }).Bool)
  }
  return false
}

export default function AccountantFeesPage() {
  const [heads, setHeads] = useState<any[]>([])
  const [series, setSeries] = useState<any[]>([])
  const [loadingHeads, setLoadingHeads] = useState(true)
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [creatingHead, setCreatingHead] = useState(false)
  const [creatingSeries, setCreatingSeries] = useState(false)
  const [newHead, setNewHead] = useState({ name: "", type: "general" })
  const [newSeries, setNewSeries] = useState({ prefix: "RCPT", start_number: 1 })

  useEffect(() => {
    void Promise.all([fetchHeads(), fetchSeries()])
  }, [])

  const fetchHeads = async () => {
    setLoadingHeads(true)
    try {
      const res = await apiClient("/accountant/fees/heads")
      if (res.ok) {
        const data = await res.json()
        setHeads(data || [])
      }
    } catch (err) {
      console.error("Failed to fetch fee heads", err)
      toast.error("Failed to load fee heads")
    } finally {
      setLoadingHeads(false)
    }
  }

  const fetchSeries = async () => {
    setLoadingSeries(true)
    try {
      const res = await apiClient("/accountant/receipts/series")
      if (res.ok) {
        const data = await res.json()
        setSeries(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to fetch receipt series", err)
      toast.error("Failed to load receipt series")
    } finally {
      setLoadingSeries(false)
    }
  }

  const handleSavePlan = async (plan: any) => {
    try {
      const res = await apiClient("/accountant/fees/plans", {
        method: "POST",
        body: JSON.stringify(plan)
      })
      if (res.ok) {
        toast.success("Fee plan created successfully")
        fetchHeads()
      }
    } catch (err) {
      toast.error("Failed to save plan")
    }
  }

  const createFeeHead = async () => {
    if (!newHead.name.trim()) {
      toast.error("Fee head name is required")
      return
    }
    setCreatingHead(true)
    try {
      const res = await apiClient("/accountant/fees/heads", {
        method: "POST",
        body: JSON.stringify({ name: newHead.name.trim(), type: newHead.type.trim() || "general" }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Fee head created")
      setNewHead({ name: "", type: newHead.type })
      await fetchHeads()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create fee head")
    } finally {
      setCreatingHead(false)
    }
  }

  const createReceiptSeries = async () => {
    if (!newSeries.prefix.trim()) {
      toast.error("Receipt prefix is required")
      return
    }
    setCreatingSeries(true)
    try {
      const res = await apiClient("/accountant/receipts/series", {
        method: "POST",
        body: JSON.stringify({
          prefix: newSeries.prefix.trim(),
          start_number: Math.max(1, Number(newSeries.start_number) || 1),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Receipt series created")
      await fetchSeries()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create receipt series")
    } finally {
      setCreatingSeries(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Finance Management</h1>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Fee Plans</TabsTrigger>
          <TabsTrigger value="heads">Fee Heads</TabsTrigger>
          <TabsTrigger value="series">Receipt Series</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeePlanBuilder onSave={handleSavePlan} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold">Configured Fee Heads</h2>
              {loadingHeads ? (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
                  Loading fee heads...
                </div>
              ) : heads.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
                  No fee heads defined yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {heads.map((head) => (
                    <Card key={head.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{head.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Type</span>
                          <Badge variant="outline">{head.type || "general"}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heads" className="pt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Fee Head</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newHead.name}
                    onChange={(e) => setNewHead({ ...newHead, name: e.target.value })}
                    placeholder="Tuition Fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={newHead.type}
                    onChange={(e) => setNewHead({ ...newHead, type: e.target.value })}
                    placeholder="general"
                  />
                </div>
                <Button onClick={() => void createFeeHead()} disabled={creatingHead}>
                  {creatingHead ? "Creating..." : "Add Head"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Heads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingHeads ? (
                  <p className="text-sm text-muted-foreground">Loading fee heads...</p>
                ) : heads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fee heads created yet.</p>
                ) : heads.map((head) => (
                  <div key={textValue(head?.id) || head?.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{head?.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {textValue(head?.id) || "n/a"}</p>
                    </div>
                    <Badge variant="outline">{textValue(head?.type) || head?.type || "general"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="series" className="pt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Receipt Series</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label>Prefix</Label>
                  <Input
                    value={newSeries.prefix}
                    onChange={(e) => setNewSeries({ ...newSeries, prefix: e.target.value.toUpperCase() })}
                    placeholder="RCPT"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Number</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newSeries.start_number}
                    onChange={(e) => setNewSeries({ ...newSeries, start_number: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                <Button onClick={() => void createReceiptSeries()} disabled={creatingSeries}>
                  {creatingSeries ? "Creating..." : "Add Series"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receipt Series</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingSeries ? (
                  <p className="text-sm text-muted-foreground">Loading receipt series...</p>
                ) : series.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No receipt series configured yet.</p>
                ) : series.map((row) => (
                  <div key={textValue(row?.id) || `${row?.prefix}-${intValue(row?.current_number)}`} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{row?.prefix || "Series"}</p>
                      <p className="text-xs text-muted-foreground">
                        Current Number: {intValue(row?.current_number)}
                      </p>
                    </div>
                    <Badge className={boolValue(row?.is_active) ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}>
                      {boolValue(row?.is_active) ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
