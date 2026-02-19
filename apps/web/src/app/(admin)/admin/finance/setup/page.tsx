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

// Mock or Fetch active AY
const CURRENT_AY = "2024-2025" // In real app, fetch from context/API

export default function FeeSetupPage() {
  const [activeTab, setActiveTab] = useState("heads")
  
  // -- Heads State --
  const [heads, setHeads] = useState<FeeHead[]>([])
  const [newHead, setNewHead] = useState({ name: "", type: "recurring" })
  
  // -- Structure State --
  const [configs, setConfigs] = useState<FeeConfig[]>([])
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]) // Need to fetch classes
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
    fetchClasses() // Need an endpoint for this or reuse standard one
  }, [])

  // Fetch Logic
  const fetchHeads = async () => {
    const res = await apiClient("/admin/fees/heads")
    if (res.ok) setHeads(await res.json())
  }
  
  const fetchClasses = async () => {
      // Assuming exist. If not, we might need to mock or find the endpoint.
      // Usually /admin/academics/classes
      const res = await apiClient("/admin/academics/classes")
      if (res.ok) setClasses(await res.json())
  }

  const fetchStructure = async (clsId: string) => {
    // CURRENT_AY should be dynamic. fetching current active year. 
    // For now hardcoding or using the first one found in contexts if available.
    // Let's assume we have an endpoint to get current academic year context.
    const ayRes = await apiClient("/admin/academics/years/current") 
    let ayId = ""
    if (ayRes.ok) {
        const ay = await ayRes.json()
        ayId = ay.id
    }
    
    if (!ayId) return 

    const res = await apiClient(`/admin/fees/structure?academic_year_id=${ayId}&class_id=${clsId}`)
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
                  academic_year_id: "", // Filled on save or init
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
    // Determine AY
    // For now assuming we have a way to get current AY ID. 
    // If configs already has it, use it. Else fetch or use default.
    // Making a call to fetch structure sets configs, so it should have AYID if existing.
    // If new, we need current AYID.
    
    // Quick fix: Fetch current AY or use hardcoded/context if avail. 
    // real implementation: `const { ayId } = useAcademicYear()`
    
    // For this implementation, I will rely on fetching structure to give me AYID context or 
    // logic to get it.
    
    // Let's rely on the one fetched in fetchStructure if possible, 
    // or fetch it again if needed.
    
    let kAY = cfg.academic_year_id
    if (!kAY) {
         // Try to find from other configs
         const sibling = configs.find(c => c.academic_year_id)
         if (sibling) kAY = sibling.academic_year_id
         else {
             // Fallback fetch
             const ayRes = await apiClient("/admin/academics/years/current")
             if (ayRes.ok) {
                 const ay = await ayRes.json()
                 kAY = ay.id
             }
         }
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fee Setup Wizard</h1>
          <p className="text-slate-400 font-medium">Configure fee structures, heads, and payment gateways.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 p-1 border border-white/5 rounded-2xl mb-6">
          <TabsTrigger value="heads" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2">
            <Layers className="h-4 w-4" /> Fee Heads
          </TabsTrigger>
          <TabsTrigger value="structure" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2">
            <School className="h-4 w-4" /> Class Structures
          </TabsTrigger>
          <TabsTrigger value="optional" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2">
            <Layers className="h-4 w-4" /> Optional / Transport
          </TabsTrigger>
          <TabsTrigger value="gateways" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2">
            <CreditCard className="h-4 w-4" /> Payment Gateways
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: FEE HEADS --- */}
        <TabsContent value="heads">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-white/5 rounded-3xl md:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Create New Head</CardTitle>
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
                <Button onClick={handleCreateHead} className="w-full bg-indigo-600 hover:bg-indigo-500">
                    <Plus className="h-4 w-4 mr-2" /> Add Fee Head
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5 rounded-3xl md:col-span-2">
              <CardHeader>
                <CardTitle>Existing Fee Heads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                    {heads.map(head => (
                        <div key={head.id} className="p-4 bg-white/5 rounded-xl flex items-center justify-between border border-white/5">
                            <div>
                                <h4 className="font-bold text-white">{head.name}</h4>
                                <span className="text-xs text-slate-400 uppercase tracking-wider">{head.type}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Edit</Button>
                        </div>
                    ))}
                    {heads.length === 0 && <p className="text-slate-500 text-center py-8">No fee heads found.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB 2: STRUCTURES --- */}
        <TabsContent value="structure">
             <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Class Fee Configuration</CardTitle>
                <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); fetchStructure(v); }}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                    <div className="text-center py-20 text-slate-500">
                        <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a class to configure fees</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-amber-500/10 text-amber-500 p-4 rounded-xl text-sm mb-4">
                            Define the standard fee structure for this class. Variations can be handled via scholarships.
                        </div>
{/* Matrix Editor */}
                        <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Fee Head</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Amount (₹)</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Due Date</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Optional</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
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
                                            <tr key={head.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{head.name}</td>
                                                <td className="px-6 py-4">
                                                    <Input 
                                                        type="number" 
                                                        value={cfg.amount} 
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value)
                                                            handleUpdateConfig(head.id, { amount: isNaN(val) ? 0 : val })
                                                        }}
                                                        className="h-9 bg-slate-800/50 border-white/10 w-32"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Input 
                                                        type="date" 
                                                        value={cfg.due_date ? cfg.due_date.slice(0, 10) : ""} 
                                                        onChange={e => handleUpdateConfig(head.id, { due_date: e.target.value })}
                                                        className="h-9 bg-slate-800/50 border-white/10 w-40"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Switch 
                                                        checked={cfg.is_optional} 
                                                        onCheckedChange={c => handleUpdateConfig(head.id, { is_optional: c })}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => saveConfig(head.id, cfg)}
                                                        className="bg-indigo-600 hover:bg-indigo-500 h-8"
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
                )}
              </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB 3: OPTIONAL / TRANSPORT FEES --- */}
        <TabsContent value="optional">
           <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-amber-400" /> Optional & Transport Fees
                </CardTitle>
                <p className="text-slate-400 text-sm">
                    Items like Bus Routes, Uniform Kits, or Annual Function tickets that can be assigned to specific students. 
                    <br/>
                    (Management of individual student assignment is done via the <strong>Student 360</strong> profile).
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10 text-slate-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <p>Optional Items Configuration coming soon.</p>
                    <p className="text-xs mt-2">Currently, these are managed via the database or 'Extras' module.</p>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB 4: GATEWAYS --- */}
        <TabsContent value="gateways">
           <Card className="bg-slate-900/50 border-white/5 rounded-3xl max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-400" /> Gateway Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4 mb-6">
                    <Button 
                        variant={gateway.provider === 'razorpay' ? 'default' : 'outline'}
                        onClick={() => { setGateway({...gateway, provider: 'razorpay'}); fetchGateway('razorpay'); }}
                        className={gateway.provider === 'razorpay' ? "bg-blue-600 hover:bg-blue-500" : ""}
                    >
                        Razorpay
                    </Button>
                    <Button 
                        variant={gateway.provider === 'payu' ? 'default' : 'outline'}
                        onClick={() => { setGateway({...gateway, provider: 'payu'}); fetchGateway('payu'); }}
                        className={gateway.provider === 'payu' ? "bg-emerald-600 hover:bg-emerald-500" : ""}
                    >
                        PayU / PayU Bolt
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
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
                        <p className="text-xs text-slate-500">
                            {gateway.provider === 'payu' ? 'Stored as the Merchant Salt' : 'Stored securely'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input value={gateway.webhook_secret} onChange={e => setGateway({...gateway, webhook_secret: e.target.value})} type="password" />
                    </div>

                    <Button onClick={handleSaveGateway} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl mt-4">
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
