"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowRight } from "lucide-react";

type SupportTicket = {
  id: string;
  tenant_id?: string;
  subject: string;
  priority: string;
  status: string;
  tags: string[];
  assigned_to?: string;
  due_at?: string | null;
  created_at: string;
  updated_at: string;
};

type CreatePayload = {
  tenant_id?: string;
  subject: string;
  priority?: string;
  tags?: string[];
  assigned_to?: string;
  due_at?: string;
};

type NoteAttachment = {
  name: string;
  url: string;
};

type SupportTicketNote = {
  id: string;
  ticket_id: string;
  note_type: string;
  note: string;
  attachments: Record<string, any>[];
  created_by?: string;
  created_by_email?: string;
  created_by_name?: string;
  created_at: string;
};

type SupportSLAPolicy = {
  response_hours: Record<string, number>;
  resolution_hours: Record<string, number>;
  escalation?: {
    enabled?: boolean;
    tag?: string;
    bump_priority?: string;
  };
  updated_at?: string | null;
};

type SupportSLAOverview = {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  response_overdue: number;
  resolution_overdue: number;
  generated_at: string;
};

export default function PlatformSupportDeskPage() {
  const [rows, setRows] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [newTenantId, setNewTenantId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newDueAt, setNewDueAt] = useState("");

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesTicket, setNotesTicket] = useState<SupportTicket | null>(null);
  const [notes, setNotes] = useState<SupportTicketNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteType, setNewNoteType] = useState<"internal" | "customer">("internal");
  const [newNote, setNewNote] = useState("");
  const [newAttachments, setNewAttachments] = useState<NoteAttachment[]>([]);

  const [slaOverview, setSlaOverview] = useState<SupportSLAOverview | null>(null);
  const [slaPolicy, setSlaPolicy] = useState<SupportSLAPolicy | null>(null);
  const [slaDraft, setSlaDraft] = useState<SupportSLAPolicy | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    params.set("limit", "100");
    return params.toString();
  }, [priority, search, status]);

  const load = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/support/tickets?${query}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loadSLAPolicy = async () => {
    try {
      const res = await apiClient("/admin/platform/support/sla/policy");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as SupportSLAPolicy;
      setSlaPolicy(data);
      setSlaDraft(data);
    } catch (e: any) {
      setSlaPolicy(null);
      setSlaDraft(null);
      setError(e?.message || "Failed to load SLA policy.");
    }
  };

  const loadSLAOverview = async () => {
    try {
      const res = await apiClient("/admin/platform/support/sla/overview");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as SupportSLAOverview;
      setSlaOverview(data);
    } catch (e: any) {
      setSlaOverview(null);
      setError(e?.message || "Failed to load SLA overview.");
    }
  };

  useEffect(() => {
    void loadSLAPolicy();
    void loadSLAOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSLAPolicy = async () => {
    if (!slaDraft) return;
    setBusyId("sla:save");
    setError("");
    setMessage("");
    try {
      const res = await apiClient("/admin/platform/support/sla/policy", {
        method: "POST",
        body: JSON.stringify({
          response_hours: slaDraft.response_hours || {},
          resolution_hours: slaDraft.resolution_hours || {},
          escalation: slaDraft.escalation || {},
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as SupportSLAPolicy;
      setSlaPolicy(data);
      setSlaDraft(data);
      setMessage("SLA policy updated.");
      await loadSLAOverview();
    } catch (e: any) {
      setError(e?.message || "Failed to update SLA policy.");
    } finally {
      setBusyId("");
    }
  };

  const runSLAEscalations = async () => {
    setBusyId("sla:run");
    setError("");
    setMessage("");
    try {
      const res = await apiClient("/admin/platform/support/sla/escalations/run", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      await loadSLAOverview();
      await load();
      setMessage(
        `Escalations applied. Response: ${data.response_escalated ?? 0}, Resolution: ${data.resolution_escalated ?? 0}.`,
      );
    } catch (e: any) {
      setError(e?.message || "Failed to run SLA escalations.");
    } finally {
      setBusyId("");
    }
  };

  const loadNotes = async (ticketId: string) => {
    setNotesLoading(true);
    try {
      const res = await apiClient(`/admin/platform/support/tickets/${ticketId}/notes`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setNotes([]);
      setError(e?.message || "Failed to load ticket notes.");
    } finally {
      setNotesLoading(false);
    }
  };

  const openNotes = async (ticket: SupportTicket) => {
    setError("");
    setMessage("");
    setNotesTicket(ticket);
    setNotesOpen(true);
    setNewNoteType("internal");
    setNewNote("");
    setNewAttachments([]);
    await loadNotes(ticket.id);
  };

  const closeNotes = () => {
    setNotesOpen(false);
    setNotesTicket(null);
    setNotes([]);
    setNewNote("");
    setNewAttachments([]);
  };

  const createTicket = async () => {
    setBusyId("create");
    setError("");
    setMessage("");
    try {
      const payload: CreatePayload = {
        subject: newSubject.trim(),
        priority: newPriority,
      };
      if (!payload.subject) throw new Error("Subject is required.");

      const tid = newTenantId.trim();
      if (tid) payload.tenant_id = tid;

      const assignee = newAssignedTo.trim();
      if (assignee) payload.assigned_to = assignee;

      const tags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length) payload.tags = tags;

      if (newDueAt) {
        const dt = new Date(newDueAt);
        if (!Number.isNaN(dt.getTime())) payload.due_at = dt.toISOString();
      }

      const res = await apiClient("/admin/platform/support/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setNewSubject("");
      setNewTags("");
      setNewDueAt("");
      setMessage("Ticket created.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create ticket.");
    } finally {
      setBusyId("");
    }
  };

  const addTicketNote = async () => {
    if (!notesTicket) return;
    setBusyId(`note:${notesTicket.id}`);
    setError("");
    setMessage("");
    try {
      const note = newNote.trim();
      if (!note) throw new Error("Note is required.");

      const attachments = newAttachments
        .map((a) => ({ name: a.name.trim(), url: a.url.trim() }))
        .filter((a) => a.name || a.url);

      const payload: any = { note_type: newNoteType, note };
      if (attachments.length) payload.attachments = attachments;

      const res = await apiClient(`/admin/platform/support/tickets/${notesTicket.id}/notes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setNewNote("");
      setNewAttachments([]);
      setMessage("Note added.");
      await loadNotes(notesTicket.id);
    } catch (e: any) {
      setError(e?.message || "Failed to add note.");
    } finally {
      setBusyId("");
    }
  };

  const addAttachment = () => {
    setNewAttachments((prev) => [...prev, { name: "", url: "" }]);
  };

  const updateAttachment = (idx: number, patch: Partial<NoteAttachment>) => {
    setNewAttachments((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const removeAttachment = (idx: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTicket = async (ticketId: string, patch: any) => {
    setBusyId(ticketId);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/support/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Ticket updated.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update ticket.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading support tickets...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4">
        <Link href="/platform/support" className="flex items-center text-xs font-black text-primary hover:underline gap-1 uppercase tracking-widest">
          <ArrowRight className="h-3 w-3 rotate-180" />
          Back to Support Desk
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Support Desk</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Create and manage support tickets for tenants and users.</p>
        </div>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Open</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{slaOverview?.open ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">In progress</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{slaOverview?.in_progress ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{slaOverview?.resolved ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground">Closed</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{slaOverview?.closed ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-xs font-semibold text-muted-foreground">Response overdue</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{slaOverview?.response_overdue ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-xs font-semibold text-muted-foreground">Resolution overdue</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{slaOverview?.resolution_overdue ?? "-"}</p>
        </div>
      </div>

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">SLA Policy & Escalations</summary>
        <div className="mt-4 grid gap-4">
          {!slaDraft ? (
            <div className="text-sm text-muted-foreground">Loading SLA policy...</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Response SLA (hours)</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {["low", "normal", "high", "critical"].map((k) => (
                      <label key={`resp:${k}`} className="grid gap-1 text-xs text-muted-foreground">
                        <span className="capitalize">{k}</span>
                        <input
                          type="number"
                          min={1}
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                          value={slaDraft.response_hours?.[k] ?? ""}
                          onChange={(e) =>
                            setSlaDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    response_hours: {
                                      ...(prev.response_hours || {}),
                                      [k]: Math.max(0, Math.floor(Number(e.target.value || "0"))),
                                    },
                                  }
                                : prev,
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Resolution SLA (hours)</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {["low", "normal", "high", "critical"].map((k) => (
                      <label key={`res:${k}`} className="grid gap-1 text-xs text-muted-foreground">
                        <span className="capitalize">{k}</span>
                        <input
                          type="number"
                          min={1}
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                          value={slaDraft.resolution_hours?.[k] ?? ""}
                          onChange={(e) =>
                            setSlaDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    resolution_hours: {
                                      ...(prev.resolution_hours || {}),
                                      [k]: Math.max(0, Math.floor(Number(e.target.value || "0"))),
                                    },
                                  }
                                : prev,
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={!!slaDraft.escalation?.enabled}
                    onChange={(e) =>
                      setSlaDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              escalation: { ...(prev.escalation || {}), enabled: e.target.checked },
                            }
                          : prev,
                      )
                    }
                  />
                  Escalations enabled
                </label>
                <input
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Escalation tag (e.g. sla_breached)"
                  value={slaDraft.escalation?.tag || ""}
                  onChange={(e) =>
                    setSlaDraft((prev) =>
                      prev ? { ...prev, escalation: { ...(prev.escalation || {}), tag: e.target.value } } : prev,
                    )
                  }
                />
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={slaDraft.escalation?.bump_priority || ""}
                  onChange={(e) =>
                    setSlaDraft((prev) =>
                      prev
                        ? { ...prev, escalation: { ...(prev.escalation || {}), bump_priority: e.target.value } }
                        : prev,
                    )
                  }
                  title="Optional: bump priority on resolution breach"
                >
                  <option value="">No bump</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                <button
                  onClick={() => void runSLAEscalations()}
                  disabled={busyId === "sla:run"}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-60"
                >
                  {busyId === "sla:run" ? "Running..." : "Run escalations now"}
                </button>
                <button
                  onClick={() => void saveSLAPolicy()}
                  disabled={busyId === "sla:save"}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {busyId === "sla:save" ? "Saving..." : "Save policy"}
                </button>
              </div>

              {slaPolicy?.updated_at && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(slaPolicy.updated_at).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>
      </details>

      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Create Ticket</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Tenant ID (optional)"
              value={newTenantId}
              onChange={(e) => setNewTenantId(e.target.value)}
            />
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Subject (required)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Assigned to (user UUID, optional)"
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value)}
              />
            </div>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Tags (comma separated)"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={newDueAt}
              onChange={(e) => setNewDueAt(e.target.value)}
              title="Due at"
            />
            <button
              onClick={() => void createTicket()}
              disabled={busyId === "create"}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busyId === "create" ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Search subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button
              onClick={() => void load()}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No tickets.</div>}
        {rows.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{t.status}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{t.priority}</span>
                  {t.tenant_id && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">tenant</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{t.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground break-all">
                  {t.tenant_id ? `Tenant: ${t.tenant_id}` : "Tenant: (none)"} · Assigned: {t.assigned_to || "(none)"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created: {new Date(t.created_at).toLocaleString()} · Updated: {new Date(t.updated_at).toLocaleString()}
                </p>
                {t.tags?.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">Tags: {t.tags.join(", ")}</p>
                ) : null}
              </div>

              <div className="flex w-full flex-col gap-2 md:w-72">
                <button
                  onClick={() => void openNotes(t)}
                  disabled={busyId === `note:${t.id}`}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-60"
                >
                  Notes
                </button>
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={t.status}
                  onChange={(e) => void updateTicket(t.id, { status: e.target.value })}
                  disabled={busyId === t.id}
                  title="Status"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={t.priority}
                  onChange={(e) => void updateTicket(t.id, { priority: e.target.value })}
                  disabled={busyId === t.id}
                  title="Priority"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notesOpen && notesTicket && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-border p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Ticket</p>
                <p className="truncate text-sm font-semibold text-foreground">{notesTicket.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground break-all">ID: {notesTicket.id}</p>
              </div>
              <button
                onClick={closeNotes}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                Close
              </button>
            </div>

            <div className="max-h-[45vh] overflow-y-auto p-4">
              {notesLoading ? (
                <div className="text-sm text-muted-foreground">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-sm text-muted-foreground">No notes yet.</div>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                          {n.note_type}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{n.note}</p>
                      {(n.created_by_name || n.created_by_email) && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          By: {n.created_by_name || n.created_by_email}
                        </p>
                      )}
                      {Array.isArray(n.attachments) && n.attachments.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Attachments</p>
                          {n.attachments.map((a: any, idx: number) => (
                            <div key={`${n.id}:att:${idx}`} className="text-xs text-muted-foreground break-all">
                              {a?.name ? `${a.name}: ` : ""}
                              {a?.url ? (
                                <a className="underline hover:text-foreground" href={String(a.url)} target="_blank" rel="noreferrer">
                                  {String(a.url)}
                                </a>
                              ) : (
                                <span>(no url)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="grid gap-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground md:w-60"
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value === "customer" ? "customer" : "internal")}
                    title="Note type"
                  >
                    <option value="internal">Internal note</option>
                    <option value="customer">Customer visible</option>
                  </select>
                  <button
                    onClick={addAttachment}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    Add attachment
                  </button>
                </div>

                <textarea
                  className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Write a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />

                {newAttachments.length > 0 && (
                  <div className="grid gap-2">
                    {newAttachments.map((a, idx) => (
                      <div key={`att:${idx}`} className="grid gap-2 md:grid-cols-5">
                        <input
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-2"
                          placeholder="Name"
                          value={a.name}
                          onChange={(e) => updateAttachment(idx, { name: e.target.value })}
                        />
                        <input
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-3"
                          placeholder="URL"
                          value={a.url}
                          onChange={(e) => updateAttachment(idx, { url: e.target.value })}
                        />
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent md:col-span-5"
                        >
                          Remove attachment
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => void addTicketNote()}
                    disabled={busyId === `note:${notesTicket.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {busyId === `note:${notesTicket.id}` ? "Saving..." : "Add note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
