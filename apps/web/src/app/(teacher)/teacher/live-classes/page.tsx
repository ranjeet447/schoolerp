"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@schoolerp/ui";
import { toast } from "sonner";

type LiveEvent = {
  id: string;
  provider: string;
  title: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string;
  status: string;
};

export default function TeacherLiveClassesPage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    class_id: "",
    section_id: "",
    starts_at: "",
    ends_at: "",
    provider: "",
  });

  const load = async () => {
    try {
      const res = await apiClient("/teacher/live-classes/list");
      if (!res.ok) throw new Error("Failed to load live classes");
      const data = await res.json();
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load live classes");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const schedule = async () => {
    setSaving(true);
    try {
      const res = await apiClient("/teacher/live-classes/schedule", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to schedule live class");
      toast.success("Live class scheduled");
      setForm({ title: "", description: "", class_id: "", section_id: "", starts_at: "", ends_at: "", provider: "" });
      await load();
    } catch (err: any) {
      if (String(err.message || "").includes("UPGRADE_REQUIRED")) {
        toast.error("Upgrade required: enable the corresponding Live Classes add-on");
      } else {
        toast.error(err.message || "Failed to schedule live class");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule live classes with Google Meet or Microsoft Teams after connecting an integration and enabling the add-on.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Schedule Live Class</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Provider (optional)</Label>
            <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="google_workspace or microsoft_365" />
          </div>
          <div className="grid gap-2">
            <Label>Class ID (optional)</Label>
            <Input value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Section ID (optional)</Label>
            <Input value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Starts At</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Ends At</Label>
            <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="button" onClick={() => void schedule()} disabled={saving}>
              {saving ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Scheduled Live Classes</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Start</th>
                <th className="py-2 pr-3">End</th>
                <th className="py-2 pr-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan={5} className="py-3 text-muted-foreground">No live classes scheduled yet.</td></tr>
              ) : events.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 pr-3">{row.title}</td>
                  <td className="py-2 pr-3">{row.provider}</td>
                  <td className="py-2 pr-3">{new Date(row.starts_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">{new Date(row.ends_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">
                    {row.meeting_url ? <a className="text-primary underline" href={row.meeting_url} target="_blank" rel="noreferrer">Open</a> : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
