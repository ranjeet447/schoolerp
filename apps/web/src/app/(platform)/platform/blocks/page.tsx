"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type SecurityBlock = {
  id: string;
  target_type: "tenant" | "user" | string;
  target_tenant_id?: string;
  target_user_id?: string;
  status: "active" | "released" | string;
  severity: "info" | "warning" | "critical" | string;
  reason: string;
  created_at: string;
  expires_at?: string | null;
  released_at?: string | null;
  created_by_name?: string;
  created_by_email?: string;
  released_by_name?: string;
  released_by_email?: string;
  metadata?: Record<string, any>;
};

type CreateBlockPayload = {
  target_type: "tenant" | "user";
  target_tenant_id?: string;
  target_user_id?: string;
  severity?: "info" | "warning" | "critical";
  reason: string;
  expires_in_minutes?: number;
};

export default function PlatformRiskBlocksPage() {
  const [rows, setRows] = useState<SecurityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [status, setStatus] = useState<"active" | "released">("active");
  const [targetType, setTargetType] = useState<"tenant" | "user">("tenant");
  const [tenantId, setTenantId] = useState("");
  const [userId, setUserId] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [reason, setReason] = useState("");
  const [expiresInMinutes, setExpiresInMinutes] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState<Record<string, string>>({});

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("limit", "100");
    return params.toString();
  }, [status]);

  const load = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/security/blocks?${query}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load blocks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const createBlock = async () => {
    setError("");
    setMessage("");
    setBusyId("create");
    try {
      const payload: CreateBlockPayload = {
        target_type: targetType,
        severity,
        reason: reason.trim(),
      };
      if (!payload.reason) throw new Error("Reason is required.");

      if (targetType === "tenant") {
        const t = tenantId.trim();
        if (!t) throw new Error("Tenant ID is required.");
        payload.target_tenant_id = t;
      } else {
        const u = userId.trim();
        if (!u) throw new Error("User ID is required.");
        payload.target_user_id = u;
      }

      const mins = Number(expiresInMinutes) || 0;
      if (mins > 0) payload.expires_in_minutes = mins;

      const res = await apiClient("/admin/platform/security/blocks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setReason("");
      setExpiresInMinutes(0);
      setMessage("Block created and sessions revoked.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create block.");
    } finally {
      setBusyId("");
    }
  };

  const releaseBlock = async (blockId: string) => {
    setError("");
    setMessage("");
    setBusyId(blockId);
    try {
      const notes = (releaseNotes[blockId] || "").trim();
      const res = await apiClient(`/admin/platform/security/blocks/${blockId}/release`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(await res.text());

      setReleaseNotes((prev) => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
      setMessage("Block released.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to release block.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading risk blocks...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Risk Blocks</h1>
        <p className="text-muted-foreground">
          Block a tenant or a user in response to security events. Blocks are audited and can be released.
        </p>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Create Block</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use only for confirmed abuse, fraud, or incident response.</p>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value === "user" ? "user" : "tenant")}
              >
                <option value="tenant">Tenant</option>
                <option value="user">User</option>
              </select>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={severity}
                onChange={(e) => setSeverity((e.target.value as any) || "warning")}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {targetType === "tenant" ? (
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Tenant ID (UUID)"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
            ) : (
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="User ID (UUID)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            )}

            <input
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <input
              type="number"
              min={0}
              max={525600}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Expires in minutes (0 = never)"
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(Number(e.target.value) || 0)}
            />

            <button
              onClick={() => void createBlock()}
              disabled={busyId === "create"}
              className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {busyId === "create" ? "Creating..." : "Create Block"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">List</h2>
          <div className="mt-4 flex items-center gap-2">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={status}
              onChange={(e) => setStatus(e.target.value === "released" ? "released" : "active")}
            >
              <option value="active">Active</option>
              <option value="released">Released</option>
            </select>
            <button
              onClick={() => void load()}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {rows.length === 0 && <div className="text-sm text-muted-foreground">No blocks.</div>}
            {rows.map((b) => (
              <div key={b.id} className="rounded-lg border border-border bg-background/40 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{b.target_type}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{b.severity}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{b.status}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground break-all">{b.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground break-all">
                      {b.target_type === "tenant" ? `Tenant: ${b.target_tenant_id}` : `User: ${b.target_user_id}`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created: {new Date(b.created_at).toLocaleString()}
                      {b.expires_at ? ` · Expires: ${new Date(b.expires_at).toLocaleString()}` : ""}
                    </p>
                  </div>

                  {b.status === "active" && (
                    <div className="flex w-full flex-col gap-2 md:w-72">
                      <input
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                        placeholder="Release notes (optional)"
                        value={releaseNotes[b.id] || ""}
                        onChange={(e) => setReleaseNotes((prev) => ({ ...prev, [b.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => void releaseBlock(b.id)}
                        disabled={busyId === b.id}
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
                      >
                        {busyId === b.id ? "Releasing..." : "Release"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

