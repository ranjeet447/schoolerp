"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support Desk</h1>
        <p className="text-muted-foreground">Create and manage support tickets for tenants and users.</p>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

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
    </div>
  );
}

