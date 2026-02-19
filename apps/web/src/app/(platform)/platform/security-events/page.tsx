"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type PlatformSecurityEventRow = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role_name: string;
  event_type: string;
  severity: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string;
  origin: string;
  request_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type PlatformDataRetentionPolicy = {
  audit_logs_days: number;
  security_events_days: number;
  sessions_days: number;
  integration_logs_days: number;
  outbox_events_days: number;
  updated_at?: string;
};

type Filters = {
  tenant_id: string;
  user_id: string;
  event_type: string;
  severity: string;
  created_from: string;
  created_to: string;
  limit: number;
  offset: number;
};

const initialFilters: Filters = {
  tenant_id: "",
  user_id: "",
  event_type: "",
  severity: "",
  created_from: "",
  created_to: "",
  limit: 100,
  offset: 0,
};

function severityBadge(severity: string) {
  const s = (severity || "").toLowerCase();
  if (s === "critical") return "border-red-600/40 text-red-700 dark:border-red-700 dark:text-red-200";
  if (s === "warning") return "border-amber-600/40 text-amber-700 dark:border-amber-700 dark:text-amber-200";
  return "border-border text-muted-foreground";
}

export default function PlatformSecurityEventsPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [rows, setRows] = useState<PlatformSecurityEventRow[]>([]);
  const [retentionPolicy, setRetentionPolicy] = useState<PlatformDataRetentionPolicy | null>(null);
  const [retentionDraft, setRetentionDraft] = useState({
    audit_logs_days: 365,
    security_events_days: 90,
    sessions_days: 30,
    integration_logs_days: 30,
    outbox_events_days: 30,
  });
  const [loading, setLoading] = useState(true);
  const [policyBusy, setPolicyBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.tenant_id.trim()) params.set("tenant_id", filters.tenant_id.trim());
    if (filters.user_id.trim()) params.set("user_id", filters.user_id.trim());
    if (filters.event_type.trim()) params.set("event_type", filters.event_type.trim());
    if (filters.severity.trim()) params.set("severity", filters.severity.trim());
    if (filters.created_from.trim()) params.set("created_from", filters.created_from.trim());
    if (filters.created_to.trim()) params.set("created_to", filters.created_to.trim());
    params.set("limit", String(filters.limit || 100));
    params.set("offset", String(filters.offset || 0));
    return params.toString();
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/security/events?${query}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load security events.");
    } finally {
      setLoading(false);
    }
  };

  const loadRetentionPolicy = async () => {
    try {
      const res = await apiClient("/admin/platform/security/retention-policy");
      if (!res.ok) return;
      const data: PlatformDataRetentionPolicy = await res.json();
      setRetentionPolicy(data);
      setRetentionDraft({
        audit_logs_days: Number(data.audit_logs_days || 0) || 365,
        security_events_days: Number(data.security_events_days || 0) || 90,
        sessions_days: Number(data.sessions_days || 0) || 30,
        integration_logs_days: Number(data.integration_logs_days || 0) || 30,
        outbox_events_days: Number(data.outbox_events_days || 0) || 30,
      });
    } catch {
      // Keep silent; policy is optional on fresh environments until migrated.
    }
  };

  const saveRetentionPolicy = async () => {
    setPolicyBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient("/admin/platform/security/retention-policy", {
        method: "POST",
        body: JSON.stringify({
          audit_logs_days: Number(retentionDraft.audit_logs_days) || 0,
          security_events_days: Number(retentionDraft.security_events_days) || 0,
          sessions_days: Number(retentionDraft.sessions_days) || 0,
          integration_logs_days: Number(retentionDraft.integration_logs_days) || 0,
          outbox_events_days: Number(retentionDraft.outbox_events_days) || 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Data retention policy updated.");
      await loadRetentionPolicy();
    } catch (e: any) {
      setError(e?.message || "Failed to update retention policy.");
    } finally {
      setPolicyBusy(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    void loadRetentionPolicy();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security Events</h1>
        <p className="text-muted-foreground">
          Monitor authentication, IP allowlist blocks, CORS denials, and rate-limit events.
        </p>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Data Retention Policy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure recommended retention windows (days) for operational data. Values are stored at platform scope.
            </p>
          </div>
          <button
            type="button"
            onClick={saveRetentionPolicy}
            disabled={policyBusy}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Save Policy
          </button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Audit logs (days)</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={retentionDraft.audit_logs_days}
              onChange={(e) => setRetentionDraft((p) => ({ ...p, audit_logs_days: Number(e.target.value) || 0 }))}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Security events (days)</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={retentionDraft.security_events_days}
              onChange={(e) =>
                setRetentionDraft((p) => ({ ...p, security_events_days: Number(e.target.value) || 0 }))
              }
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Sessions (days)</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={retentionDraft.sessions_days}
              onChange={(e) => setRetentionDraft((p) => ({ ...p, sessions_days: Number(e.target.value) || 0 }))}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Integration logs (days)</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={retentionDraft.integration_logs_days}
              onChange={(e) =>
                setRetentionDraft((p) => ({ ...p, integration_logs_days: Number(e.target.value) || 0 }))
              }
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Outbox events (days)</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={retentionDraft.outbox_events_days}
              onChange={(e) =>
                setRetentionDraft((p) => ({ ...p, outbox_events_days: Number(e.target.value) || 0 }))
              }
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: {retentionPolicy?.updated_at ? new Date(retentionPolicy.updated_at).toLocaleString() : "-"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            disabled={loading || policyBusy}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Reset
          </button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-6">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Tenant ID (UUID)"
            value={filters.tenant_id}
            onChange={(e) => setFilters((p) => ({ ...p, tenant_id: e.target.value, offset: 0 }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="User ID (UUID)"
            value={filters.user_id}
            onChange={(e) => setFilters((p) => ({ ...p, user_id: e.target.value, offset: 0 }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Event type contains..."
            value={filters.event_type}
            onChange={(e) => setFilters((p) => ({ ...p, event_type: e.target.value, offset: 0 }))}
          />
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={filters.severity}
            onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value, offset: 0 }))}
          >
            <option value="">All severities</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
          <input
            type="date"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={filters.created_from}
            onChange={(e) => setFilters((p) => ({ ...p, created_from: e.target.value, offset: 0 }))}
            title="Created from"
          />
          <input
            type="date"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={filters.created_to}
            onChange={(e) => setFilters((p) => ({ ...p, created_to: e.target.value, offset: 0 }))}
            title="Created to"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {rows.length === 0 ? 0 : filters.offset + 1}-{filters.offset + rows.length}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={filters.limit}
            onChange={(e) =>
              setFilters((p) => ({ ...p, limit: Number(e.target.value) || 100, offset: 0 }))
            }
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
          <button
            type="button"
            disabled={loading || filters.offset <= 0}
            onClick={() =>
              setFilters((p) => ({ ...p, offset: Math.max(0, (p.offset || 0) - (p.limit || 100)) }))
            }
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={loading || rows.length < (filters.limit || 100)}
            onClick={() =>
              setFilters((p) => ({ ...p, offset: (p.offset || 0) + (p.limit || 100) }))
            }
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Next
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                  Loading security events...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                  No security events found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <p className="font-medium">{row.event_type || "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.method || "-"} {row.path || "-"} {row.status_code ? `(${row.status_code})` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded border px-2 py-1 text-xs ${severityBadge(row.severity)}`}
                    >
                      {row.severity || "info"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{row.tenant_name || "-"}</p>
                    <p className="text-xs">{row.tenant_id || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{row.user_name || "-"}</p>
                    <p className="text-xs">{row.user_email || row.user_id || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p className="text-xs">{row.request_id || "-"}</p>
                    <p className="text-xs">{row.origin || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.ip_address || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <code className="block max-w-[32rem] truncate text-xs">
                      {row.metadata ? JSON.stringify(row.metadata) : "{}"}
                    </code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
