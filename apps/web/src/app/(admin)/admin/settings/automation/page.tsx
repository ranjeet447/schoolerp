"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Settings,
  Activity,
  ToggleLeft,
  ToggleRight,
  Code,
  Info
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
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
  DialogFooter,
  Label,
  Textarea,
  Switch
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger_event: string;
  condition_json: any;
  action_json: any;
  is_active: boolean;
}

export default function AutomationManagementPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    trigger_event: "student.created",
    condition_json: "{}",
    action_json: "{}",
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await apiClient("/admin/automation/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.trigger_event) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        condition_json: JSON.parse(form.condition_json),
        action_json: JSON.parse(form.action_json)
      };

      const method = editingRule ? "PUT" : "POST";
      const url = editingRule ? `/admin/automation/rules/${editingRule.id}` : "/admin/automation/rules";

      const res = await apiClient(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAddOpen(false);
        resetForm();
        fetchRules();
      }
    } catch (e) {
      alert("Invalid JSON in condition or action field");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      const res = await apiClient(`/admin/automation/rules/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchRules();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setForm({ 
      name: "", 
      description: "", 
      trigger_event: "student.created",
      condition_json: "{}",
      action_json: "{}",
      is_active: true
    });
    setEditingRule(null);
  };

  const startEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description || "",
      trigger_event: rule.trigger_event,
      condition_json: JSON.stringify(rule.condition_json, null, 2),
      action_json: JSON.stringify(rule.action_json, null, 2),
      is_active: rule.is_active
    });
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Studio</h1>
          <p className="text-muted-foreground">Define rules to automate school operations.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Create Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" /> Webhook Trigger Events
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-3 text-blue-800">
            <p className="font-mono bg-white p-1 rounded">student.created</p>
            <p className="font-mono bg-white p-1 rounded">fee.overdue</p>
            <p className="font-mono bg-white p-1 rounded">attendance.absent</p>
            <p className="mt-4 pt-2 border-t border-blue-100 flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>Rules are evaluated in the background whenever these events occur.</span>
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Trigger Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      No automation rules defined yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div className="font-bold">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">{rule.description}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{rule.trigger_event}</TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => startEdit(rule)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Automation Rule" : "Create New Rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Welcome Email to New Students"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Input 
                  value={form.trigger_event}
                  onChange={e => setForm({...form, trigger_event: e.target.value})}
                  placeholder="e.g. student.created"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Briefly describe what this rule does"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Code className="h-3 w-3" /> Condition (JSON)
                </Label>
                <Textarea 
                  className="font-mono text-xs h-32"
                  value={form.condition_json}
                  onChange={e => setForm({...form, condition_json: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Code className="h-3 w-3" /> Action (JSON)
                </Label>
                <Textarea 
                  className="font-mono text-xs h-32"
                  value={form.action_json}
                  onChange={e => setForm({...form, action_json: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                checked={form.is_active} 
                onCheckedChange={checked => setForm({...form, is_active: checked})}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
