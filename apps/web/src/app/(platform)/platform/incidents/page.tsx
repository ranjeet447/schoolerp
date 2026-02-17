"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type PlatformIncident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  scope: string;
  affected_tenant_ids: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
};

type PlatformIncidentEvent = {
  id: string;
  incident_id: string;
  event_type: string;
  message: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_by_email?: string;
  created_by_name?: string;
  created_at: string;
};

type IncidentDetail = {
  incident: PlatformIncident;
  events: PlatformIncidentEvent[];
};

export default function PlatformIncidentsPage() {
  const [rows, setRows] = useState<PlatformIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [scope, setScope] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState("minor");
  const [newScope, setNewScope] = useState("platform");
  const [newAffectedTenants, setNewAffectedTenants] = useState("");
  const [newInitialMessage, setNewInitialMessage] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<IncidentDetail | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSeverity, setEditSeverity] = useState("");
  const [editScope, setEditScope] = useState("");
  const [editAffectedTenants, setEditAffectedTenants] = useState("");
  const [editUpdateMessage, setEditUpdateMessage] = useState("");

  const [newEventType, setNewEventType] = useState<"update" | "note">("update");
  const [newEventMessage, setNewEventMessage] = useState("");

  const [limitOverrideKey, setLimitOverrideKey] = useState("students");
  const [limitOverrideValue, setLimitOverrideValue] = useState("");
  const [limitOverrideExpiresAt, setLimitOverrideExpiresAt] = useState("");
  const [limitOverrideReason, setLimitOverrideReason] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (severity) params.set("severity", severity);
    if (scope) params.set("scope", scope);
    params.set("limit", "100");
    return params.toString();
  }, [scope, search, severity, status]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient(`/admin/platform/incidents?${query}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openDetail = async (incidentId: string) => {
    setBusyId(`open:${incidentId}`);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/incidents/${incidentId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as IncidentDetail;
      setDetail(data);
      setDetailOpen(true);
      setEditTitle(data.incident.title || "");
      setEditStatus(data.incident.status || "investigating");
      setEditSeverity(data.incident.severity || "minor");
      setEditScope(data.incident.scope || "platform");
      setEditAffectedTenants((data.incident.affected_tenant_ids || []).join(", "));
      setEditUpdateMessage("");
      setNewEventType("update");
      setNewEventMessage("");
    } catch (e: any) {
      setError(e?.message || "Failed to load incident detail.");
    } finally {
      setBusyId("");
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
    setEditUpdateMessage("");
    setNewEventMessage("");
  };

  const createIncident = async () => {
    setBusyId("create");
    setError("");
    setMessage("");
    try {
      const title = newTitle.trim();
      if (!title) throw new Error("Title is required.");

      const affectedTenantIds = newAffectedTenants
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const payload: any = {
        title,
        severity: newSeverity,
        scope: newScope,
      };
      if (affectedTenantIds.length) payload.affected_tenant_ids = affectedTenantIds;
      if (newInitialMessage.trim()) payload.initial_message = newInitialMessage.trim();

      const res = await apiClient("/admin/platform/incidents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setNewTitle("");
      setNewAffectedTenants("");
      setNewInitialMessage("");
      setMessage("Incident created.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create incident.");
    } finally {
      setBusyId("");
    }
  };

  const saveIncident = async () => {
    if (!detail) return;
    setBusyId(`save:${detail.incident.id}`);
    setError("");
    setMessage("");
    try {
      const affectedTenantIds = editAffectedTenants
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const payload: any = {
        title: editTitle.trim(),
        status: editStatus,
        severity: editSeverity,
        scope: editScope,
        affected_tenant_ids: affectedTenantIds,
      };
      if (editUpdateMessage.trim()) payload.update_message = editUpdateMessage.trim();

      const res = await apiClient(`/admin/platform/incidents/${detail.incident.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as IncidentDetail;
      setDetail(updated);
      setEditUpdateMessage("");
      setMessage("Incident updated.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update incident.");
    } finally {
      setBusyId("");
    }
  };

  const addEvent = async () => {
    if (!detail) return;
    setBusyId(`event:${detail.incident.id}`);
    setError("");
    setMessage("");
    try {
      const msg = newEventMessage.trim();
      if (!msg) throw new Error("Message is required.");

      const res = await apiClient(`/admin/platform/incidents/${detail.incident.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          event_type: newEventType,
          message: msg,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setNewEventMessage("");
      setMessage("Event added.");

      // Refresh detail quickly.
      const dres = await apiClient(`/admin/platform/incidents/${detail.incident.id}`);
      if (dres.ok) {
        const data = (await dres.json()) as IncidentDetail;
        setDetail(data);
      }
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to add incident event.");
    } finally {
      setBusyId("");
    }
  };

  const applyIncidentLimitOverride = async () => {
    if (!detail) return;
    setBusyId(`limit:${detail.incident.id}`);
    setError("");
    setMessage("");
    try {
      const limitValue = Number(limitOverrideValue);
      if (!Number.isFinite(limitValue) || limitValue < 0) {
        throw new Error("Limit value must be a non-negative number.");
      }
      const reason = limitOverrideReason.trim();
      if (!reason) throw new Error("Reason is required.");

      const payload: Record<string, unknown> = {
        limit_key: limitOverrideKey,
        limit_value: Math.floor(limitValue),
        reason,
      };
      if (limitOverrideExpiresAt.trim()) {
        payload.expires_at = new Date(limitOverrideExpiresAt).toISOString();
      }

      const res = await apiClient(`/admin/platform/incidents/${detail.incident.id}/limit-overrides`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setLimitOverrideValue("");
      setLimitOverrideExpiresAt("");
      setLimitOverrideReason("");
      setMessage("Limit override applied to affected tenants.");
    } catch (e: any) {
      setError(e?.message || "Failed to apply limit override.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading incidents...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Incidents</h1>
        <p className="text-muted-foreground">Track platform incidents and communicate updates with a timeline.</p>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Create Incident</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Title (required)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                title="Severity"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                title="Scope"
              >
                <option value="platform">Platform</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Affected tenant IDs (comma separated, optional)"
              value={newAffectedTenants}
              onChange={(e) => setNewAffectedTenants(e.target.value)}
            />
            <textarea
              className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Initial update (optional)"
              value={newInitialMessage}
              onChange={(e) => setNewInitialMessage(e.target.value)}
            />
            <button
              onClick={() => void createIncident()}
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
              placeholder="Search title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">All severities</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="">All scopes</option>
              <option value="platform">Platform</option>
              <option value="tenant">Tenant</option>
            </select>
            <button onClick={() => void load()} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No incidents.</div>}
        {rows.map((i) => (
          <div key={i.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{i.status}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{i.severity}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{i.scope}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{i.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated: {new Date(i.updated_at).toLocaleString()} · Created: {new Date(i.created_at).toLocaleString()}
                </p>
                {Array.isArray(i.affected_tenant_ids) && i.affected_tenant_ids.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground break-all">
                    Tenants: {i.affected_tenant_ids.slice(0, 3).join(", ")}
                    {i.affected_tenant_ids.length > 3 ? ` (+${i.affected_tenant_ids.length - 3} more)` : ""}
                  </p>
                )}
              </div>

              <div className="flex w-full flex-col gap-2 md:w-48">
                <button
                  onClick={() => void openDetail(i.id)}
                  disabled={busyId === `open:${i.id}`}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-60"
                >
                  {busyId === `open:${i.id}` ? "Opening..." : "Open"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {detailOpen && detail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-border p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Incident</p>
                <p className="truncate text-sm font-semibold text-foreground">{detail.incident.title}</p>
                <p className="mt-1 text-xs text-muted-foreground break-all">ID: {detail.incident.id}</p>
              </div>
              <button onClick={closeDetail} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent">
                Close
              </button>
            </div>

            <div className="grid gap-6 p-4 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Update Incident</h3>
                <div className="grid gap-2">
                  <input
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      title="Status"
                    >
                      <option value="investigating">Investigating</option>
                      <option value="identified">Identified</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value)}
                      title="Severity"
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={editScope}
                    onChange={(e) => setEditScope(e.target.value)}
                    title="Scope"
                  >
                    <option value="platform">Platform</option>
                    <option value="tenant">Tenant</option>
                  </select>
                  <input
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={editAffectedTenants}
                    onChange={(e) => setEditAffectedTenants(e.target.value)}
                    placeholder="Affected tenant IDs (comma separated)"
                  />
                  <textarea
                    className="min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Update message (optional, will be added to timeline)"
                    value={editUpdateMessage}
                    onChange={(e) => setEditUpdateMessage(e.target.value)}
                  />
                  <button
                    onClick={() => void saveIncident()}
                    disabled={busyId === `save:${detail.incident.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {busyId === `save:${detail.incident.id}` ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-semibold text-muted-foreground">State</p>
                  <p className="mt-1 text-sm text-foreground">
                    {detail.incident.status} · {detail.incident.severity} · {detail.incident.scope}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated: {new Date(detail.incident.updated_at).toLocaleString()}
                    {detail.incident.resolved_at ? ` · Resolved: ${new Date(detail.incident.resolved_at).toLocaleString()}` : ""}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Temporary Limit Override</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Apply a temporary (or permanent) limit override to affected tenants for this incident. A reason is required for audit logging.
                  </p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      value={limitOverrideKey}
                      onChange={(e) => setLimitOverrideKey(e.target.value)}
                      title="Limit key"
                    >
                      <option value="students">students</option>
                      <option value="staff">staff</option>
                      <option value="storage_mb">storage_mb</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      placeholder="Limit value"
                      value={limitOverrideValue}
                      onChange={(e) => setLimitOverrideValue(e.target.value)}
                    />
                    <input
                      type="datetime-local"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      value={limitOverrideExpiresAt}
                      onChange={(e) => setLimitOverrideExpiresAt(e.target.value)}
                    />
                    <button
                      onClick={() => void applyIncidentLimitOverride()}
                      disabled={busyId === `limit:${detail.incident.id}` || !limitOverrideValue.trim() || !limitOverrideReason.trim()}
                      className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
                    >
                      {busyId === `limit:${detail.incident.id}` ? "Applying..." : "Apply override"}
                    </button>
                  </div>
                  <textarea
                    className="mt-2 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder="Reason (required)"
                    value={limitOverrideReason}
                    onChange={(e) => setLimitOverrideReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Timeline</h3>

                <div className="max-h-[30vh] space-y-3 overflow-y-auto rounded-lg border border-border bg-background p-3">
                  {detail.events.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No timeline events yet.</div>
                  ) : (
                    detail.events.map((e) => (
                      <div key={e.id} className="rounded-md border border-border bg-card p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{e.event_type}</span>
                          <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{e.message}</p>
                        {(e.created_by_name || e.created_by_email) && (
                          <p className="mt-2 text-xs text-muted-foreground">By: {e.created_by_name || e.created_by_email}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Add Event</p>
                  <div className="mt-2 grid gap-2">
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value === "note" ? "note" : "update")}
                      title="Event type"
                    >
                      <option value="update">Update</option>
                      <option value="note">Internal note</option>
                    </select>
                    <textarea
                      className="min-h-[88px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Message (required)"
                      value={newEventMessage}
                      onChange={(e) => setNewEventMessage(e.target.value)}
                    />
                    <button
                      onClick={() => void addEvent()}
                      disabled={busyId === `event:${detail.incident.id}`}
                      className="rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
                    >
                      {busyId === `event:${detail.incident.id}` ? "Adding..." : "Add event"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
