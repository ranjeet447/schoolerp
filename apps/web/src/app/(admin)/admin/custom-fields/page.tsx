"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { Plus, Settings, Trash2, Edit2, Save, X, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldDefinition {
  id: string;
  entity_type: string;
  field_name: string;
  field_label: string;
  field_type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
}

const ENTITY_TYPES = ["student", "employee", "guardian"];
const FIELD_TYPES = ["text", "number", "date", "select", "multiselect", "boolean", "textarea"];

export default function CustomFieldsPage() {
  const [definitions, setDefinitions] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("student");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    field_name: "", field_label: "", field_type: "text", options: "",
    is_required: false, sort_order: 0,
  });

  const loadDefs = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/admin/custom-fields/definitions?entity_type=${activeType}`);
      if (res.ok) setDefinitions(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadDefs(); }, [activeType]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        entity_type: activeType,
        field_name: form.field_name.toLowerCase().replace(/\s+/g, "_"),
        field_label: form.field_label,
        field_type: form.field_type,
        options: form.options ? form.options.split(",").map(o => o.trim()).filter(Boolean) : [],
        is_required: form.is_required,
        sort_order: form.sort_order,
      };

      const url = editingId
        ? `/admin/custom-fields/definitions/${editingId}`
        : `/admin/custom-fields/definitions`;
      const method = editingId ? "PUT" : "POST";

      const res = await apiClient(url, { method, body: JSON.stringify(body) });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm({ field_name: "", field_label: "", field_type: "text", options: "", is_required: false, sort_order: 0 });
        await loadDefs();
      }
    } catch(err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this custom field?")) return;
    await apiClient(`/admin/custom-fields/definitions/${id}`, { method: "DELETE" });
    loadDefs();
  };

  const startEdit = (d: FieldDefinition) => {
    setEditingId(d.id);
    setForm({
      field_name: d.field_name, field_label: d.field_label, field_type: d.field_type,
      options: d.options?.join(", ") || "", is_required: d.is_required, sort_order: d.sort_order,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Custom Fields</h1>
          <p className="text-muted-foreground font-medium text-sm">Define additional fields for students, employees, and guardians.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ field_name: "", field_label: "", field_type: "text", options: "", is_required: false, sort_order: 0 }); }}
          className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add Field
        </Button>
      </div>

      {/* Entity Type Tabs */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit border border-border">
        {ENTITY_TYPES.map(type => (
          <button key={type} onClick={() => { setActiveType(type); setShowForm(false); }}
            className={cn(
              "px-5 py-2 rounded-md font-semibold text-sm capitalize transition-all",
              activeType === type
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}>{type}</button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4">
             <CardTitle className="text-lg">{editingId ? "Edit Field" : "New Custom Field"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Field Label *</label>
                <Input value={form.field_label} onChange={e => setForm(f => ({ ...f, field_label: e.target.value, field_name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                  placeholder="e.g., Blood Group" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Field Name (auto)</label>
                <Input value={form.field_name} readOnly className="bg-muted/50 text-muted-foreground" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">Type</label>
                <select value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {(form.field_type === "select" || form.field_type === "multiselect") && (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Options (comma separated)</label>
                  <Input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                    placeholder="A+, B+, O+" />
                </div>
              )}
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="is_required" checked={form.is_required} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
                  className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary" />
                <label htmlFor="is_required" className="text-sm font-semibold text-foreground cursor-pointer">Required field</label>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border mt-6">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }} disabled={saving} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Definitions List */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b pb-4">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg capitalize flex-1">{activeType} Custom Fields</CardTitle>
          <Badge variant="secondary" className="font-mono">{definitions.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading custom fields...
            </div>
          ) : definitions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                 <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-bold text-lg mb-1">No custom fields yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Add your first custom field for {activeType}s to collect more specific information.</p>
              <Button variant="outline" className="mt-6 gap-2" onClick={() => { setShowForm(true); setEditingId(null); setForm({ field_name: "", field_label: "", field_type: "text", options: "", is_required: false, sort_order: 0 }); }}>
                  <Plus className="h-4 w-4" /> Create First Field
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {definitions.map(d => (
                <div key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group">
                  <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground text-base">{d.field_label}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px] lowercase py-0">{d.field_name}</Badge>
                      <Badge variant="default" className="text-[10px] py-0">{d.field_type}</Badge>
                      {d.is_required && <Badge variant="destructive" className="text-[10px] py-0">Required</Badge>}
                    </div>
                    {d.options?.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {d.options.map(o => (
                          <Badge key={o} variant="secondary" className="text-[10px] font-normal py-0">
                              {o}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(d)} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
