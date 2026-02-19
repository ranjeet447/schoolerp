"use client";

import React, { useEffect, useState } from "react";
import { Button, Input } from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { Plus, Settings, Trash2, Edit2, Save, X, GripVertical } from "lucide-react";

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
    const body = {
      entity_type: activeType,
      field_name: form.field_name.toLowerCase().replace(/\s+/g, "_"),
      field_label: form.field_label,
      field_type: form.field_type,
      options: form.options ? form.options.split(",").map(o => o.trim()) : [],
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
      loadDefs();
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
          <h1 className="text-3xl font-black text-white tracking-tight">Custom Fields</h1>
          <p className="text-slate-400 font-medium">Define additional fields for students, employees, and guardians.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ field_name: "", field_label: "", field_type: "text", options: "", is_required: false, sort_order: 0 }); }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl px-6">
          <Plus className="h-4 w-4 mr-2" /> Add Field
        </Button>
      </div>

      {/* Entity Type Tabs */}
      <div className="flex gap-2">
        {ENTITY_TYPES.map(type => (
          <button key={type} onClick={() => setActiveType(type)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
              activeType === type
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}>{type}</button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white">{editingId ? "Edit Field" : "New Custom Field"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1 block">Field Label *</label>
              <Input value={form.field_label} onChange={e => setForm(f => ({ ...f, field_label: e.target.value, field_name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                placeholder="e.g., Blood Group" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1 block">Field Name (auto)</label>
              <Input value={form.field_name} readOnly className="bg-slate-800/30 border-white/5 text-slate-500 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1 block">Type</label>
              <select value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))}
                className="w-full h-10 px-3 bg-slate-800/50 border border-white/5 text-white rounded-xl">
                {FIELD_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
              </select>
            </div>
            {(form.field_type === "select" || form.field_type === "multiselect") && (
              <div>
                <label className="text-sm font-bold text-slate-400 mb-1 block">Options (comma separated)</label>
                <Input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                  placeholder="A+, B+, O+" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
              </div>
            )}
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" checked={form.is_required} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-indigo-500" />
              <label className="text-sm font-bold text-slate-400">Required field</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">
              <Save className="h-4 w-4 mr-2" /> {editingId ? "Update" : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-white rounded-xl">
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Field Definitions List */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Settings className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white capitalize">{activeType} Custom Fields</h2>
          <span className="ml-auto text-sm text-slate-500">{definitions.length} field(s)</span>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading…</div>
        ) : definitions.length === 0 ? (
          <div className="p-12 text-center">
            <Settings className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No custom fields yet</p>
            <p className="text-sm text-slate-600 mt-1">Add your first custom field for {activeType}s</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {definitions.map(d => (
              <div key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                <GripVertical className="h-4 w-4 text-slate-700 group-hover:text-slate-500" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white">{d.field_label}</div>
                  <div className="text-sm text-slate-500 flex gap-3 mt-0.5">
                    <span className="bg-slate-800 px-2 py-0.5 rounded-md text-xs font-mono">{d.field_name}</span>
                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md text-xs font-bold">{d.field_type}</span>
                    {d.is_required && <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md text-xs font-bold">Required</span>}
                  </div>
                  {d.options?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {d.options.map(o => (
                        <span key={o} className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-md">{o}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(d)} className="text-slate-400 hover:text-indigo-400">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
