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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Switch
} from "@schoolerp/ui"
import { 
  Plus, 
  Save, 
  CreditCard, 
  School, 
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

type FeeHead = {
  id: string
  name: string
  type: string
}

type FeeConfig = {
  id?: string
  academic_year_id: string
  class_id: string
  fee_head_id: string
  amount: number
  due_date?: string
  is_optional: boolean
  fee_head_name?: string
  class_name?: string
}

type GatewayConfig = {
  id?: string
  provider: string
  api_key: string
  api_secret: string
  webhook_secret: string
  is_active: boolean
  settings?: any
}

export default function FeeSetupPage() {
  const [activeTab, setActiveTab] = useState("heads")
  
  // -- Heads State --
  const [heads, setHeads] = useState<FeeHead[]>([])
  const [newHead, setNewHead] = useState({ name: "", type: "recurring" })
  
  // -- Structure State --
  const [configs, setConfigs] = useState<FeeConfig[]>([])
  const [classes, setClasses] = useState<{id: string, name: string}[]>([])
  const [academicYears, setAcademicYears] = useState<{id: string, name: string, is_active?: boolean | { Bool?: boolean }}[]>([])
  const [activeYearId, setActiveYearId] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")

  // -- Gateway State --
  const [gateway, setGateway] = useState<GatewayConfig>({
    provider: "razorpay",
    api_key: "",
    api_secret: "",
    webhook_secret: "",
    is_active: false
  })

  // Initial Data Fetch
  useEffect(() => {
    fetchHeads()
    fetchMetadata()
  }, [])

  useEffect(() => {
    if (selectedClass && activeYearId) {
      fetchStructure(selectedClass)
    }
  }, [selectedClass, activeYearId])

  // Fetch Logic
  const fetchHeads = async () => {
    const res = await apiClient("/admin/fees/heads")
    if (res.ok) setHeads(await res.json())
  }
  
  const fetchMetadata = async () => {
      try {
        const [classesRes, yearsRes] = await Promise.all([
          apiClient("/admin/academic-structure/classes"),
          apiClient("/admin/academic-structure/academic-years"),
        ])

        if (classesRes.ok) {
          const classRows = await classesRes.json()
          setClasses(Array.isArray(classRows) ? classRows : [])
        }

        if (yearsRes.ok) {
          const yearRows = await yearsRes.json()
          const list = Array.isArray(yearRows) ? yearRows : []
          setAcademicYears(list)
          if (list.length > 0) {
            const active = list.find((y: any) => y.is_active === true || y.is_active?.Bool === true) || list[0]
            setActiveYearId(active.id)
          }
        }
      } catch {
        toast.error("Failed to load class/year metadata")
      }
  }

  const fetchStructure = async (clsId: string) => {
    if (!activeYearId) {
      toast.error("Select an academic year first")
      return
    }
    const res = await apiClient(`/admin/fees/structure?academic_year_id=${activeYearId}&class_id=${clsId}`)
    if (res.ok) setConfigs(await res.json())
  }

  const fetchGateway = async (provider: string) => {
    const res = await apiClient(`/admin/fees/gateways?provider=${provider}`)
    if (res.ok) {
        setGateway(await res.json())
    } else {
        // Reset if not found
        setGateway({
            provider,
            api_key: "",
            api_secret: "",
            webhook_secret: "",
            is_active: false
        })
    }
  }

  // Action Handlers
  const handleCreateHead = async () => {
    if (!newHead.name) return toast.error("Name required")
    const res = await apiClient("/admin/fees/heads", {
        method: "POST",
        body: JSON.stringify(newHead)
    })
    if (res.ok) {
        toast.success("Fee Head Created")
        setNewHead({ name: "", type: "recurring" })
        fetchHeads()
    }
  }

  const handleSaveGateway = async () => {
    const res = await apiClient("/admin/fees/gateways", {
        method: "POST",
        body: JSON.stringify(gateway)
    })
    if (res.ok) toast.success("Gateway Config Saved")
    else toast.error("Failed to save gateway")
  }

  const handleUpdateConfig = (headId: string, updates: Partial<FeeConfig>) => {
      setConfigs(prev => {
          const exists = prev.find(c => c.fee_head_id === headId)
          if (exists) {
              return prev.map(c => c.fee_head_id === headId ? { ...c, ...updates } : c)
          } else {
              return [...prev, {
                  academic_year_id: activeYearId,
                  class_id: selectedClass,
                  fee_head_id: headId,
                  amount: 0,
                  is_optional: false,
                  ...updates
              } as FeeConfig]
          }
      })
  }

  const saveConfig = async (headId: string, cfg: FeeConfig) => {
    let kAY = cfg.academic_year_id || activeYearId
    if (!kAY) {
      const sibling = configs.find(c => c.academic_year_id)
      if (sibling) kAY = sibling.academic_year_id
    }

    if (!kAY) return toast.error("Academic Year not found")

    const payload = {
        academic_year_id: kAY,
        class_id: selectedClass,
        fee_head_id: headId,
        amount: cfg.amount,
        due_date: cfg.due_date,
        is_optional: cfg.is_optional
    }

    const res = await apiClient("/admin/fees/structure", {
        method: "POST",
        body: JSON.stringify(payload)
    })
    
    if (res.ok) toast.success("Saved")
    else toast.error("Failed to save")
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Fee Setup Wizard</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Configure fee structures, heads, and payment gateways.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-3xl">
          <TabsTrigger value="heads" className="gap-2">
            <Layers className="h-4 w-4" /> Fee Heads
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2">
            <School className="h-4 w-4" /> Class Structures
          </TabsTrigger>
          <TabsTrigger value="optional" className="gap-2">
            <Layers className="h-4 w-4" /> Optional / Transport
          </TabsTrigger>
          <TabsTrigger value="gateways" className="gap-2">
            <CreditCard className="h-4 w-4" /> Payment Gateways
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: FEE HEADS --- */}
        <TabsContent value="heads">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm md:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Create New Head</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Head Name</Label>
                    <Input 
                        placeholder="e.g. Tuition Fee" 
                        value={newHead.name} 
                        onChange={e => setNewHead({...newHead, name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newHead.type} onValueChange={v => setNewHead({...newHead, type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recurring">Recurring (Monthly/Term)</SelectItem>
                            <SelectItem value="one_time">One Time (Admission)</SelectItem>
                            <SelectItem value="fine">Fine / Penalty</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleCreateHead} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add Fee Head
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Existing Fee Heads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                    {heads.map(head => (
                        <div key={head.id} className="p-4 bg-muted/40 rounded-xl flex items-center justify-between border border-border/50">
                            <div>
                                <h4 className="font-semibold text-foreground text-sm">{head.name}</h4>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5 inline-block">{head.type}</span>
                            </div>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                    ))}
                    {heads.length === 0 && (
                      <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl">
                        <p className="text-muted-foreground text-sm font-medium">No fee heads found.</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB 2: STRUCTURES --- */}
        <TabsContent value="structure">
             <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Class Fee Configuration</CardTitle>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Select value={activeYearId} onValueChange={setActiveYearId}>
                      <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Select Academic Year" /></SelectTrigger>
                      <SelectContent>
                          {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); fetchStructure(v); }}>
                      <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
                      <SelectContent>
                          {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                    <div className="text-center py-20 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
                        <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium text-sm">Select a class to configure fees</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 p-4 rounded-xl text-sm mb-4 font-medium flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>Define the standard fee structure for this class. Variations can be handled via scholarships.</p>
                        </div>
{/* Matrix Editor */}
                        <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-muted/50 border-b">
                                      <tr className="text-muted-foreground font-semibold">
                                          <th className="px-6 py-4">Fee Head</th>
                                          <th className="px-6 py-4">Amount (₹)</th>
                                          <th className="px-6 py-4">Due Date</th>
                                          <th className="px-6 py-4 text-center">Optional</th>
                                          <th className="px-6 py-4"></th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                      {heads.map(head => {
                                          const cfg = configs.find(c => c.fee_head_id === head.id) || {
                                              academic_year_id: "",
                                              class_id: selectedClass,
                                              fee_head_id: head.id,
                                              amount: 0,
                                              is_optional: false,
                                              due_date: ""
                                          } as FeeConfig
                                          return (
                                              <tr key={head.id} className="hover:bg-muted/30 transition-colors">
                                                  <td className="px-6 py-4 font-semibold text-foreground">{head.name}</td>
                                                  <td className="px-6 py-4">
                                                      <Input 
                                                          type="number" 
                                                          value={cfg.amount} 
                                                          onChange={e => {
                                                              const val = parseFloat(e.target.value)
                                                              handleUpdateConfig(head.id, { amount: isNaN(val) ? 0 : val })
                                                          }}
                                                          className="h-9 w-32"
                                                      />
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <Input 
                                                          type="date" 
                                                          value={cfg.due_date ? cfg.due_date.slice(0, 10) : ""} 
                                                          onChange={e => handleUpdateConfig(head.id, { due_date: e.target.value })}
                                                          className="h-9 w-40"
                                                      />
                                                  </td>
                                                  <td className="px-6 py-4 text-center align-middle">
                                                      <div className="flex justify-center">
                                                        <Switch 
                                                            checked={cfg.is_optional} 
                                                            onCheckedChange={c => handleUpdateConfig(head.id, { is_optional: c })}
                                                        />
                                                      </div>
                                                  </td>
                                                  <td className="px-6 py-4 text-right">
                                                      <Button 
                                                          size="sm" 
                                                          onClick={() => saveConfig(head.id, cfg)}
                                                      >
                                                          Save
                                                      </Button>
                                                  </td>
                                              </tr>
                                          )
                                      })}
                                  </tbody>
                              </table>
                            </div>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB 3: OPTIONAL / TRANSPORT FEES --- */}
        <TabsContent value="optional">
           <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className="h-5 w-5 text-amber-500" /> Optional & Transport Fees
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1 font-medium">
                    Items like Bus Routes, Uniform Kits, or Annual Function tickets that can be assigned to specific students. 
                    <br className="hidden sm:block" />
                    (Management of individual student assignment is done via the <strong>Student 360</strong> profile).
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed flex flex-col items-center justify-center space-y-3">
                    <Layers className="h-10 w-10 text-muted-foreground/40" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Optional Items Configuration coming soon.</p>
                      <p className="text-muted-foreground text-xs mt-1">Currently, these are managed via the database or 'Extras' module.</p>
                    </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB 4: GATEWAYS --- */}
        <TabsContent value="gateways">
           <Card className="border-none shadow-sm max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" /> Gateway Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4 mb-6">
                    <Button 
                        variant={gateway.provider === 'razorpay' ? 'default' : 'outline'}
                        onClick={() => { setGateway({...gateway, provider: 'razorpay'}); fetchGateway('razorpay'); }}
                    >
                        Razorpay
                    </Button>
                    <Button 
                        variant={gateway.provider === 'payu' ? 'default' : 'outline'}
                        onClick={() => { setGateway({...gateway, provider: 'payu'}); fetchGateway('payu'); }}
                    >
                        PayU / PayU Bolt
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-border/50">
                        <Label className="text-base font-medium">Enable {gateway.provider === 'razorpay' ? 'Razorpay' : 'PayU'}</Label>
                        <Switch checked={gateway.is_active} onCheckedChange={c => setGateway({...gateway, is_active: c})} />
                    </div>

                    <div className="space-y-2">
                        <Label>API Key / Client ID</Label>
                        <Input value={gateway.api_key} onChange={e => setGateway({...gateway, api_key: e.target.value})} type="password" />
                    </div>

                    <div className="space-y-2">
                        <Label>API Secret / Salt</Label>
                        <Input value={gateway.api_secret} onChange={e => setGateway({...gateway, api_secret: e.target.value})} type="password" />
                        <p className="text-xs text-muted-foreground">
                            {gateway.provider === 'payu' ? 'Stored as the Merchant Salt' : 'Stored securely'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input value={gateway.webhook_secret} onChange={e => setGateway({...gateway, webhook_secret: e.target.value})} type="password" />
                    </div>

                    <Button onClick={handleSaveGateway} className="w-full h-12 text-base font-bold mt-4">
                        <Save className="h-4 w-4 mr-2" /> Save Configuration
                    </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
