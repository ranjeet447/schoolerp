"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Layout,
  User,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Switch,
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  user_type: string;
  layout: string;
  bg_image_url?: string;
  config?: Record<string, unknown>;
  is_default?: boolean;
};

type TemplateForm = {
  name: string;
  user_type: string;
  layout: string;
  bg_image_url: string;
  primary_color: string;
  is_default: boolean;
};

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function templateColor(template: Template) {
  const cfg = template.config || {};
  const explicit = typeof cfg.primary_color === "string" ? cfg.primary_color : "";
  if (explicit) return explicit;
  const type = (template.user_type || "").toLowerCase();
  if (type.includes("employee")) return "#059669";
  if (type.includes("visitor")) return "#7c3aed";
  return "#2563eb";
}

export default function IDCardsPage() {
  const [activeView, setActiveView] = useState("templates");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingID, setDeletingID] = useState("");
  const [form, setForm] = useState<TemplateForm>({
    name: "",
    user_type: "student",
    layout: "portrait",
    bg_image_url: "",
    primary_color: "#2563eb",
    is_default: false,
  });

  const fetchTemplates = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiClient("/admin/id-cards/templates");
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to load templates");
      }
      setTemplates(toArray<Template>(await res.json()));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load templates");
      setTemplates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchTemplates(false);
  }, []);

  const createTemplate = async () => {
    if (!form.name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        user_type: form.user_type,
        layout: form.layout,
        bg_image_url: form.bg_image_url.trim(),
        is_default: form.is_default,
        config: { primary_color: form.primary_color },
      };
      const res = await apiClient("/admin/id-cards/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to create template");
      }
      toast.success("Template created");
      setForm({
        name: "",
        user_type: form.user_type,
        layout: form.layout,
        bg_image_url: "",
        primary_color: form.primary_color,
        is_default: false,
      });
      await fetchTemplates(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setDeletingID(id);
    try {
      const res = await apiClient(`/admin/id-cards/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to delete template");
      }
      toast.success("Template deleted");
      await fetchTemplates(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setDeletingID("");
    }
  };

  const summary = useMemo(() => {
    const byType = templates.reduce<Record<string, number>>((acc, t) => {
      const key = (t.user_type || "unknown").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      total: templates.length,
      student: byType.student || 0,
      employee: byType.employee || 0,
      other: templates.length - (byType.student || 0) - (byType.employee || 0),
    };
  }, [templates]);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Digital ID Cards
          </h1>
          <p className="text-slate-400 mt-1">Design templates and generate smart ID cards for everyone.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-800 bg-slate-900/50" onClick={() => void fetchTemplates(true)} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh
          </Button>
          <Button variant="outline" className="border-slate-800 bg-slate-900/50">
            <Printer className="mr-2 h-4 w-4" /> Bulk Print
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full" onValueChange={setActiveView}>
        <TabsList className="bg-slate-900 border-slate-800 mb-6 h-12">
          <TabsTrigger value="templates" className="data-[state=active]:bg-slate-800 px-6">Templates</TabsTrigger>
          <TabsTrigger value="generate" className="data-[state=active]:bg-slate-800 px-6">Generate / Issue</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-800 px-6">General Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Create New Template</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Standard Student ID" />
              </div>
              <div className="space-y-2">
                <Label>User Type</Label>
                <Select value={form.user_type} onValueChange={(v) => setForm((p) => ({ ...p, user_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select value={form.layout} onValueChange={(v) => setForm((p) => ({ ...p, layout: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Background URL</Label>
                <Input value={form.bg_image_url} onChange={(e) => setForm((p) => ({ ...p, bg_image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={form.primary_color} onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))} className="h-10 w-14 p-1" />
                  <Input value={form.primary_color} onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="block">Default Template</Label>
                <div className="h-10 flex items-center">
                  <Switch checked={form.is_default} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_default: checked }))} />
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Button onClick={() => void createTemplate()} className="bg-blue-600 hover:bg-blue-500" disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" /> {saving ? "Creating..." : "Create Template"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-400">Loading templates...</Card>
          ) : templates.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-400">No ID card templates found.</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tpl) => {
                const color = templateColor(tpl);
                return (
                  <Card key={tpl.id} className="bg-slate-900 border-slate-800 overflow-hidden group">
                    <div className="aspect-[3/4] p-6 flex flex-col items-center justify-center bg-slate-950/80 relative overflow-hidden">
                      <div className="w-full h-full rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col" style={{ borderColor: `${color}40` }}>
                        <div className="h-1/4 flex items-center justify-center p-3 relative" style={{ background: `linear-gradient(to bottom right, ${color}, ${color}dd)` }}>
                          <div className="text-[10px] font-bold text-white/60 absolute top-2 right-2">ID: {tpl.id.slice(0, 8)}</div>
                          <div className="h-6 w-full bg-white/20 rounded blur-[2px]" />
                        </div>
                        <div className="flex-1 bg-slate-900 p-4 flex flex-col items-center gap-3">
                          <div className="h-20 w-20 rounded-full border-4 border-slate-800 bg-slate-800 flex items-center justify-center -mt-10 overflow-hidden">
                            <User className="h-10 w-10 text-slate-700" />
                          </div>
                          <div className="space-y-2 w-full">
                            <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto" />
                            <div className="h-3 bg-slate-800 rounded w-1/2 mx-auto" />
                          </div>
                          <div className="mt-auto h-8 w-8 bg-white/10 rounded-sm border border-slate-800" />
                        </div>
                      </div>
                    </div>

                    <CardHeader className="py-4">
                      <div className="flex justify-between items-center gap-2">
                        <CardTitle className="text-base">{tpl.name}</CardTitle>
                        {tpl.is_default ? (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-black">
                            Default
                          </span>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Layout className="h-3 w-3" /> {tpl.layout}</span>
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {tpl.user_type}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                          onClick={() => void deleteTemplate(tpl.id)}
                          disabled={deletingID === tpl.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Issue New ID Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Total Templates</label>
                  <div className="h-10 px-3 rounded-md bg-slate-950 border border-slate-800 flex items-center">{summary.total}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Student Templates</label>
                  <div className="h-10 px-3 rounded-md bg-slate-950 border border-slate-800 flex items-center">{summary.student}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Employee Templates</label>
                  <div className="h-10 px-3 rounded-md bg-slate-950 border border-slate-800 flex items-center">{summary.employee}</div>
                </div>
              </div>

              <div className="border border-slate-800 rounded-lg p-10 text-center bg-slate-950/30">
                <CreditCard className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-slate-300 font-medium">Template catalog is now API-backed.</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Use template APIs and roster APIs to generate issuance batches in the next step.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Template settings are persisted through the ID card template API.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
