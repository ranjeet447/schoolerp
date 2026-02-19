"use client";

import React, { useEffect, useState } from "react";
import { Button, Input } from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { Shield, Plus, Edit2, Trash2, Palette, X, Save } from "lucide-react";

interface House {
  id: string;
  name: string;
  color: string;
  logo_url: string;
  is_active: boolean;
}

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: "#6366f1", logo_url: "" });

  const loadHouses = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/admin/houses");
      if (res.ok) setHouses(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadHouses(); }, []);

  const handleSave = async () => {
    const url = editingId ? `/admin/houses/${editingId}` : "/admin/houses";
    const method = editingId ? "PUT" : "POST";
    const res = await apiClient(url, { method, body: JSON.stringify(form) });
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", color: "#6366f1", logo_url: "" });
      loadHouses();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this house?")) return;
    await apiClient(`/admin/houses/${id}`, { method: "DELETE" });
    loadHouses();
  };

  const startEdit = (h: House) => {
    setEditingId(h.id);
    setForm({ name: h.name, color: h.color || "#6366f1", logo_url: h.logo_url || "" });
    setShowForm(true);
  };

  const PRESET_COLORS = [
    { name: "Red", hex: "#ef4444" },
    { name: "Blue", hex: "#3b82f6" },
    { name: "Green", hex: "#22c55e" },
    { name: "Yellow", hex: "#eab308" },
    { name: "Purple", hex: "#8b5cf6" },
    { name: "Orange", hex: "#f97316" },
    { name: "Pink", hex: "#ec4899" },
    { name: "Teal", hex: "#14b8a6" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">House System</h1>
          <p className="text-slate-400 font-medium">Manage school houses for inter-house competitions and activities.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", color: "#6366f1", logo_url: "" }); }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl px-6">
          <Plus className="h-4 w-4 mr-2" /> Add House
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white">{editingId ? "Edit House" : "New House"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1 block">House Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Phoenix" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1 block">Logo URL (optional)</label>
              <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                placeholder="https://..." className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-2 block">House Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c.hex} onClick={() => setForm(f => ({ ...f, color: c.hex }))}
                  className={`h-10 w-10 rounded-xl border-2 transition-all ${form.color === c.hex ? "border-white scale-110 shadow-lg" : "border-transparent hover:border-white/30"}`}
                  style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
              <div className="flex items-center gap-2 ml-2">
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="h-10 w-10 rounded-xl cursor-pointer border-0 bg-transparent" />
                <span className="text-xs text-slate-500 font-mono">{form.color}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">
              <Save className="h-4 w-4 mr-2" /> {editingId ? "Update" : "Create"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-white rounded-xl">
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Houses Grid */}
      {loading ? (
        <div className="p-6 text-sm text-slate-400">Loading…</div>
      ) : houses.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-12 text-center backdrop-blur-sm">
          <Shield className="h-16 w-16 text-slate-700 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-400">No houses created</p>
          <p className="text-sm text-slate-600 mt-2">Create houses like Phoenix, Dragon, Spartan to group students for competitions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {houses.map(h => (
            <div key={h.id} className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-all">
              <div className="h-3" style={{ backgroundColor: h.color || "#6366f1" }} />
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl font-black"
                      style={{ backgroundColor: (h.color || "#6366f1") + "20", color: h.color || "#6366f1" }}>
                      {h.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{h.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Palette className="h-3 w-3 text-slate-500" />
                        <span className="text-xs text-slate-500 font-mono">{h.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(h)} className="text-slate-400 hover:text-indigo-400 flex-1">
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)} className="text-slate-400 hover:text-red-400 flex-1">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
