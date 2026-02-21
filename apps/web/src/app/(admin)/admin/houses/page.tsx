"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Label } from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { Shield, Plus, Edit2, Trash2, Palette, X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">House System</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage school houses for inter-house competitions and activities.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", color: "#6366f1", logo_url: "" }); }}>
          <Plus className="h-4 w-4 mr-2" /> Add House
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit House" : "New House"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>House Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Phoenix" />
              </div>
              <div className="space-y-2">
                <Label>Logo URL (optional)</Label>
                <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-3">
              <Label>House Color</Label>
              <div className="flex gap-2 flex-wrap items-center">
                {PRESET_COLORS.map(c => (
                  <button key={c.hex} onClick={() => setForm(f => ({ ...f, color: c.hex }))}
                    className={cn("h-10 w-10 rounded-xl border-2 transition-all", form.color === c.hex ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-primary/30")}
                    style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
                <div className="flex items-center gap-2 ml-2">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="h-10 w-10 rounded-xl cursor-pointer border-0 bg-transparent p-0" />
                  <span className="text-xs text-muted-foreground font-mono font-medium">{form.color}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> {editingId ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Houses Grid */}
      {loading ? (
        <div className="py-12 flex justify-center text-muted-foreground font-medium">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading houses...
        </div>
      ) : houses.length === 0 ? (
        <Card className="border-none shadow-sm p-12 text-center bg-muted/20 border-dashed">
          <Shield className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl font-bold text-foreground">No houses created</p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Create houses like Phoenix, Dragon, Spartan to group students for competitions.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {houses.map(h => (
            <Card key={h.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <div className="h-2 w-full" style={{ backgroundColor: h.color || "#6366f1" }} />
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-black"
                      style={{ backgroundColor: (h.color || "#6366f1") + "15", color: h.color || "#6366f1" }}>
                      {h.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-foreground font-bold text-lg">{h.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono font-medium">{h.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(h)} className="flex-1 w-full">
                    <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDelete(h.id)} className="flex-1 w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
