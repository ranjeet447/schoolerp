"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  PackageOpen, 
  Flag, 
  Plus, 
  ShieldCheck,
  Zap,
  MoreHorizontal,
  Loader2,
  Copy,
  Power
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@schoolerp/ui";

// --- Types ---

type PlatformPlan = {
  id: string;
  code: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  modules: Record<string, unknown>;
  limits: Record<string, unknown>;
  feature_flags: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FeatureRolloutForm = {
  flag_key: string;
  enabled: boolean;
  percentage: string;
  plan_code: string;
  region: string;
  status: string;
  tenant_ids_csv: string;
  dry_run: boolean;
};

const EMPTY_ROLLOUT_FORM: FeatureRolloutForm = {
  flag_key: "",
  enabled: true,
  percentage: "50",
  plan_code: "",
  region: "",
  status: "",
  tenant_ids_csv: "",
  dry_run: true,
};

// --- Helpers ---

function mustParseJSONObject(raw: string, label: string) {
  try {
    const value = JSON.parse(raw || "{}");
    if (!value || Array.isArray(value) || typeof value !== "object") {
      throw new Error(`${label} must be a JSON object.`);
    }
    return value;
  } catch {
    throw new Error(`${label} must be valid JSON object.`);
  }
}

// --- Component ---

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  
  // Create/Edit Plan State
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    code: "",
    name: "",
    description: "",
    price_monthly: "0",
    price_yearly: "0",
    modules_text: "{}",
    limits_text: "{}",
    feature_flags_text: "{}",
    is_active: true
  });

  // Rollout State
  const [rolloutForm, setRolloutForm] = useState<FeatureRolloutForm>(EMPTY_ROLLOUT_FORM);
  const [rolloutResult, setRolloutResult] = useState<string>("");

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/admin/platform/plans?include_inactive=true");
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // --- Actions ---

  const handleOpenPlanDialog = (plan?: PlatformPlan) => {
    if (plan) {
      setEditingPlanId(plan.id);
      setPlanForm({
        code: plan.code,
        name: plan.name,
        description: plan.description || "",
        price_monthly: String(plan.price_monthly),
        price_yearly: String(plan.price_yearly),
        modules_text: JSON.stringify(plan.modules || {}, null, 2),
        limits_text: JSON.stringify(plan.limits || {}, null, 2),
        feature_flags_text: JSON.stringify(plan.feature_flags || {}, null, 2),
        is_active: plan.is_active
      });
    } else {
      setEditingPlanId(null);
      setPlanForm({
        code: "",
        name: "",
        description: "",
        price_monthly: "0",
        price_yearly: "0",
        modules_text: "{}",
        limits_text: "{}",
        feature_flags_text: "{}",
        is_active: true
      });
    }
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    setBusyId("save-plan");
    try {
      const payload = {
        code: planForm.code,
        name: planForm.name,
        description: planForm.description,
        price_monthly: Number(planForm.price_monthly || 0),
        price_yearly: Number(planForm.price_yearly || 0),
        modules: mustParseJSONObject(planForm.modules_text, "Modules"),
        limits: mustParseJSONObject(planForm.limits_text, "Limits"),
        feature_flags: mustParseJSONObject(planForm.feature_flags_text, "Feature flags"),
        is_active: planForm.is_active,
      };

      let res;
      if (editingPlanId) {
        res = await apiClient(`/admin/platform/plans/${editingPlanId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiClient("/admin/platform/plans", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error(await res.text());
      
      setPlanDialogOpen(false);
      loadPlans();
    } catch (e: any) {
      alert(e.message); // Simple alert for now, toast in real app
    } finally {
      setBusyId("");
    }
  };

  const handleClonePlan = async (plan: PlatformPlan) => {
    const cloneCode = window.prompt("Clone code (must be unique):", `${plan.code}-copy`);
    if (!cloneCode) return;
    setBusyId(`clone-${plan.id}`);
    try {
        await apiClient(`/admin/platform/plans/${plan.id}/clone`, {
            method: "POST",
            body: JSON.stringify({
                code: cloneCode.trim(),
                name: `${plan.name} Copy`,
                description: plan.description || "",
                is_active: false
            })
        });
        loadPlans();
    } catch(e) { console.error(e) } finally { setBusyId(""); }
  };

   const handleToggleStatus = async (plan: PlatformPlan) => {
    setBusyId(`toggle-${plan.id}`);
    try {
        await apiClient(`/admin/platform/plans/${plan.id}`, {
            method: "PATCH",
            body: JSON.stringify({ is_active: !plan.is_active })
        });
        loadPlans();
    } catch(e) { console.error(e) } finally { setBusyId(""); }
  };

  const handleRollout = async () => {
    setBusyId("rollout");
    setRolloutResult("");
    try {
        const payload = {
            flag_key: rolloutForm.flag_key.trim(),
            enabled: rolloutForm.enabled,
            percentage: Number(rolloutForm.percentage || 0),
            plan_code: rolloutForm.plan_code.trim(),
            region: rolloutForm.region.trim(),
            status: rolloutForm.status.trim(),
            tenant_ids: rolloutForm.tenant_ids_csv.split(",").map(t => t.trim()).filter(Boolean),
            dry_run: rolloutForm.dry_run,
        };
        const res = await apiClient("/admin/platform/feature-rollouts", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            const data = await res.json();
            setRolloutResult(`Success: matched ${data.total_matched}, selected ${data.applied_count} (${data.dry_run ? 'DRY RUN' : 'APPLIED'}).`);
        }
    } catch(e) { console.error(e) } finally { setBusyId(""); }
  };

  // --- Render ---

  const stats = [
    { name: "Starter", icon: PackageOpen, count: plans.filter(p => p.code.includes('start') || p.price_monthly < 50).length, color: "text-blue-500 bg-blue-500/10" },
    { name: "Pro", icon: Zap, count: plans.filter(p => p.code.includes('pro') || (p.price_monthly >= 50 && p.price_monthly < 500)).length, color: "text-amber-500 bg-amber-500/10" },
    { name: "Enterprise", icon: ShieldCheck, count: plans.filter(p => p.code.includes('ent') || p.price_monthly >= 500).length, color: "text-indigo-500 bg-indigo-500/10" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Product Packaging</h1>
          <p className="text-muted-foreground">Manage service plans, feature flags and rollout cohorts.</p>
        </div>
        <Button onClick={() => handleOpenPlanDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Create New Plan
        </Button>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        {stats.map((p) => (
          <Card key={p.name}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{p.name} Tier</p>
                <h3 className="mt-2 text-2xl font-black text-foreground">{p.count} <span className="text-sm font-medium text-muted-foreground italic">Plans</span></h3>
              </div>
              <div className={`rounded-xl p-3 ${p.color}`}>
                <p.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="rollout">Feature Rollouts</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Price (M/Y)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : (
                            plans.map(plan => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-mono">{plan.code}</TableCell>
                                    <TableCell className="font-medium">
                                        {plan.name}
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{plan.description}</div>
                                    </TableCell>
                                    <TableCell>{plan.price_monthly} / {plan.price_yearly}</TableCell>
                                    <TableCell>
                                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                                            {plan.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenPlanDialog(plan)}>Edit Plan</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleClonePlan(plan)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Clone
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                                                    <Power className="mr-2 h-4 w-4" /> {plan.is_active ? "Deactivate" : "Activate"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </TabsContent>

        <TabsContent value="rollout">
             <div className="grid lg:grid-cols-2 gap-6">
                 <Card>
                     <CardHeader>
                         <CardTitle>Feature Rollout</CardTitle>
                         <CardDescription>Roll out a feature flag to a percentage of tenants.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                         <div className="grid gap-2">
                             <Label>Flag Key</Label>
                             <Input 
                                placeholder="e.g. beta_transport" 
                                value={rolloutForm.flag_key} 
                                onChange={e => setRolloutForm(p => ({ ...p, flag_key: e.target.value }))}
                             />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>State</Label>
                                <Select value={rolloutForm.enabled ? "enabled" : "disabled"} onValueChange={v => setRolloutForm(p => ({ ...p, enabled: v === "enabled" }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="enabled">Enabled</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Percentage %</Label>
                                <Input 
                                    type="number" 
                                    value={rolloutForm.percentage} 
                                    onChange={e => setRolloutForm(p => ({ ...p, percentage: e.target.value }))}
                                />
                            </div>
                         </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Plan Code</Label>
                                <Select value={rolloutForm.plan_code} onValueChange={v => setRolloutForm(p => ({ ...p, plan_code: v === "all" ? "" : v }))}>
                                    <SelectTrigger><SelectValue placeholder="All Plans" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Plans</SelectItem>
                                        {plans.map(plan => (
                                            <SelectItem key={plan.id} value={plan.code}>
                                                {plan.name} ({plan.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Region</Label>
                                <Input placeholder="Optional filter" value={rolloutForm.region} onChange={e => setRolloutForm(p => ({ ...p, region: e.target.value }))} />
                            </div>
                         </div>
                         <div className="grid gap-2">
                             <Label>Tenant IDs (CSV)</Label>
                             <Textarea 
                                placeholder="Specific tenant overrides..." 
                                value={rolloutForm.tenant_ids_csv} 
                                onChange={e => setRolloutForm(p => ({ ...p, tenant_ids_csv: e.target.value }))}
                             />
                         </div>
                         <div className="flex items-center gap-2">
                             <input type="checkbox" checked={rolloutForm.dry_run} onChange={e => setRolloutForm(p => ({ ...p, dry_run: e.target.checked }))} id="dryrun" />
                             <Label htmlFor="dryrun">Dry Run (Simulate only)</Label>
                         </div>
                         <Button onClick={handleRollout} disabled={busyId === "rollout"}>
                            {busyId === "rollout" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Execute Rollout
                         </Button>

                         {rolloutResult && (
                             <div className="p-3 bg-muted rounded-md text-sm border font-mono mt-4">
                                 {rolloutResult}
                             </div>
                         )}
                     </CardContent>
                 </Card>
                 <Card>
                     <CardHeader>
                         <CardTitle>Active Rollouts</CardTitle>
                         <CardDescription>Current automated rollouts in progress.</CardDescription>
                     </CardHeader>
                     <CardContent>
                         <div className="text-sm text-muted-foreground italic">No active automated rollouts found.</div>
                     </CardContent>
                 </Card>
             </div>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>{editingPlanId ? "Edit Plan" : "Create Plan"}</DialogTitle>
                  <DialogDescription>Configure plan limits, pricing and modules.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                          <Label>Code</Label>
                          <Input value={planForm.code} onChange={e => setPlanForm(p => ({ ...p, code: e.target.value }))} placeholder="basic" />
                      </div>
                      <div className="grid gap-2">
                          <Label>Name</Label>
                          <Input value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="Basic Plan" />
                      </div>
                  </div>
                  <div className="grid gap-2">
                      <Label>Description</Label>
                      <Input value={planForm.description} onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-2">
                          <Label>Monthly Price</Label>
                          <Input type="number" value={planForm.price_monthly} onChange={e => setPlanForm(p => ({ ...p, price_monthly: e.target.value }))} />
                      </div>
                      <div className="grid gap-2">
                          <Label>Yearly Price</Label>
                          <Input type="number" value={planForm.price_yearly} onChange={e => setPlanForm(p => ({ ...p, price_yearly: e.target.value }))} />
                      </div>
                  </div>
                  <div className="grid gap-2">
                      <Label>Modules JSON</Label>
                      <Textarea className="font-mono text-xs" rows={3} value={planForm.modules_text} onChange={e => setPlanForm(p => ({ ...p, modules_text: e.target.value }))} />
                  </div>
                   <div className="grid gap-2">
                      <Label>Limits JSON</Label>
                      <Textarea className="font-mono text-xs" rows={3} value={planForm.limits_text} onChange={e => setPlanForm(p => ({ ...p, limits_text: e.target.value }))} />
                  </div>
                   <div className="grid gap-2">
                      <Label>Feature Flags JSON</Label>
                      <Textarea className="font-mono text-xs" rows={3} value={planForm.feature_flags_text} onChange={e => setPlanForm(p => ({ ...p, feature_flags_text: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2">
                       <input type="checkbox" checked={planForm.is_active} onChange={e => setPlanForm(p => ({ ...p, is_active: e.target.checked }))} id="active" />
                       <Label htmlFor="active">Active Plan</Label>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSavePlan} disabled={busyId === "save-plan"}>
                      {busyId === "save-plan" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Plan
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
