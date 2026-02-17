"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type PlatformInternalUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role_code: string;
  role_name: string;
  last_login?: string;
  active_sessions: number;
  created_at: string;
  updated_at: string;
};

type PlatformPermissionTemplate = {
  code: string;
  module: string;
  description: string;
};

type PlatformRoleTemplate = {
  role_code: string;
  role_name: string;
  permission_codes: string[];
};

type PlatformRBACMatrix = {
  roles: PlatformRoleTemplate[];
  permissions: PlatformPermissionTemplate[];
};

type PlatformIPAllowlistEntry = {
  id: string;
  role_name: string;
  cidr_block: string;
  description?: string;
  created_by?: string;
  created_at: string;
};

type PlatformUserSession = {
  id: string;
  user_id: string;
  ip_address?: string;
  device_info?: Record<string, unknown>;
  expires_at: string;
  created_at: string;
};

type PlatformSecurityPolicy = {
  enforce_internal_mfa: boolean;
  updated_at?: string;
};

type PlatformBreakGlassPolicy = {
  enabled: boolean;
  max_duration_minutes: number;
  require_ticket: boolean;
  cooldown_minutes: number;
  updated_at?: string;
};

type PlatformBreakGlassEvent = {
  id: string;
  requested_by: string;
  requested_by_name?: string;
  requested_by_email?: string;
  status: string;
  reason: string;
  ticket_ref?: string;
  duration_minutes?: number;
  expires_at?: string;
  approved_at?: string;
  created_at?: string;
};

type PlatformAuditLogRow = {
  id: number;
  tenant_id: string;
  tenant_name: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  reason_code: string;
  request_id: string;
  ip_address: string;
  created_at: string;
};

const ROLE_OPTIONS = [
  "super_admin",
  "support_l1",
  "support_l2",
  "finance",
  "ops",
  "developer",
];

export default function PlatformInternalUsersPage() {
  const [rows, setRows] = useState<PlatformInternalUser[]>([]);
  const [rbac, setRbac] = useState<PlatformRBACMatrix | null>(null);
  const [rbacDraft, setRbacDraft] = useState<Record<string, string[]>>({});
  const [ipAllowlist, setIpAllowlist] = useState<PlatformIPAllowlistEntry[]>([]);
  const [securityPolicy, setSecurityPolicy] = useState<PlatformSecurityPolicy | null>(null);
  const [breakGlassPolicy, setBreakGlassPolicy] = useState<PlatformBreakGlassPolicy | null>(null);
  const [breakGlassEvents, setBreakGlassEvents] = useState<PlatformBreakGlassEvent[]>([]);
  const [auditRows, setAuditRows] = useState<PlatformAuditLogRow[]>([]);
  const [enforceInternalMFA, setEnforceInternalMFA] = useState(false);
  const [breakGlassDraft, setBreakGlassDraft] = useState({
    enabled: false,
    max_duration_minutes: 30,
    require_ticket: true,
    cooldown_minutes: 60,
  });
  const [breakGlassActivation, setBreakGlassActivation] = useState({
    reason: "",
    duration_minutes: 15,
    ticket_ref: "",
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserSessions, setSelectedUserSessions] = useState<PlatformUserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [auditFilters, setAuditFilters] = useState({
    tenant_id: "",
    user_id: "",
    action: "",
    created_from: "",
    created_to: "",
  });

  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "",
    role_code: "support_l1",
  });
  const [newAllowlist, setNewAllowlist] = useState({
    role_name: "super_admin",
    cidr_block: "",
    description: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      query.set("limit", "200");
      if (search.trim()) query.set("q", search.trim());
      if (roleFilter.trim()) query.set("role_code", roleFilter.trim());
      if (activeFilter === "true" || activeFilter === "false") query.set("is_active", activeFilter);

      const auditQuery = new URLSearchParams();
      auditQuery.set("limit", "150");
      if (auditFilters.tenant_id.trim()) auditQuery.set("tenant_id", auditFilters.tenant_id.trim());
      if (auditFilters.user_id.trim()) auditQuery.set("user_id", auditFilters.user_id.trim());
      if (auditFilters.action.trim()) auditQuery.set("action", auditFilters.action.trim());
      if (auditFilters.created_from.trim()) auditQuery.set("created_from", auditFilters.created_from.trim());
      if (auditFilters.created_to.trim()) auditQuery.set("created_to", auditFilters.created_to.trim());

      const [usersRes, rbacRes, allowlistRes, mfaPolicyRes, breakGlassPolicyRes, breakGlassEventsRes, auditRes] = await Promise.all([
        apiClient(`/admin/platform/internal-users?${query.toString()}`),
        apiClient("/admin/platform/rbac/templates"),
        apiClient("/admin/platform/access/ip-allowlist"),
        apiClient("/admin/platform/access/policies"),
        apiClient("/admin/platform/access/break-glass/policy"),
        apiClient("/admin/platform/access/break-glass/events?limit=100"),
        apiClient(`/admin/platform/security/audit-logs?${auditQuery.toString()}`),
      ]);
      if (!usersRes.ok) throw new Error(await usersRes.text());

      const usersData = await usersRes.json();
      setRows(Array.isArray(usersData) ? usersData : []);

      if (rbacRes.ok) {
        const rbacData: PlatformRBACMatrix = await rbacRes.json();
        setRbac(rbacData);
        const draft: Record<string, string[]> = {};
        for (const role of rbacData.roles || []) {
          draft[role.role_code] = Array.isArray(role.permission_codes) ? [...role.permission_codes] : [];
        }
        setRbacDraft(draft);
      } else {
        setRbac(null);
        setRbacDraft({});
      }
      if (allowlistRes.ok) {
        const allowlistData = await allowlistRes.json();
        setIpAllowlist(Array.isArray(allowlistData) ? allowlistData : []);
      } else {
        setIpAllowlist([]);
      }
      if (mfaPolicyRes.ok) {
        const policyData: PlatformSecurityPolicy = await mfaPolicyRes.json();
        setSecurityPolicy(policyData);
        setEnforceInternalMFA(Boolean(policyData.enforce_internal_mfa));
      } else {
        setSecurityPolicy(null);
        setEnforceInternalMFA(false);
      }

      if (breakGlassPolicyRes.ok) {
        const breakGlassData: PlatformBreakGlassPolicy = await breakGlassPolicyRes.json();
        setBreakGlassPolicy(breakGlassData);
        setBreakGlassDraft({
          enabled: Boolean(breakGlassData.enabled),
          max_duration_minutes: Number(breakGlassData.max_duration_minutes) || 30,
          require_ticket: Boolean(breakGlassData.require_ticket),
          cooldown_minutes: Number(breakGlassData.cooldown_minutes) || 0,
        });
      } else {
        setBreakGlassPolicy(null);
        setBreakGlassDraft({
          enabled: false,
          max_duration_minutes: 30,
          require_ticket: true,
          cooldown_minutes: 60,
        });
      }

      if (breakGlassEventsRes.ok) {
        const eventsData = await breakGlassEventsRes.json();
        setBreakGlassEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        setBreakGlassEvents([]);
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditRows(Array.isArray(auditData) ? auditData : []);
      } else {
        setAuditRows([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load internal users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createUser = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!newUser.email.trim() || !newUser.full_name.trim() || !newUser.password || !newUser.role_code.trim()) {
        throw new Error("Email, full name, password, and role are required.");
      }

      const res = await apiClient("/admin/platform/internal-users", {
        method: "POST",
        body: JSON.stringify({
          email: newUser.email.trim(),
          full_name: newUser.full_name.trim(),
          password: newUser.password,
          role_code: newUser.role_code,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setMessage("Internal user created.");
      setNewUser({
        email: "",
        full_name: "",
        password: "",
        role_code: "support_l1",
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create internal user.");
    } finally {
      setBusy(false);
    }
  };

  const updateUser = async (userId: string, payload: Record<string, unknown>, label: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/internal-users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage(label);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update internal user.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRolePermission = (roleCode: string, permissionCode: string, checked: boolean) => {
    setRbacDraft((prev) => {
      const current = new Set(prev[roleCode] || []);
      if (checked) current.add(permissionCode);
      else current.delete(permissionCode);
      return { ...prev, [roleCode]: Array.from(current).sort() };
    });
  };

  const saveRolePermissions = async (roleCode: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/rbac/templates/${roleCode}/permissions`, {
        method: "POST",
        body: JSON.stringify({
          permission_codes: rbacDraft[roleCode] || [],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage(`Permissions updated for ${roleCode}.`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update role permissions.");
    } finally {
      setBusy(false);
    }
  };

  const createAllowlistEntry = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!newAllowlist.role_name.trim() || !newAllowlist.cidr_block.trim()) {
        throw new Error("Role and CIDR/IP are required.");
      }

      const res = await apiClient("/admin/platform/access/ip-allowlist", {
        method: "POST",
        body: JSON.stringify({
          role_name: newAllowlist.role_name.trim(),
          cidr_block: newAllowlist.cidr_block.trim(),
          description: newAllowlist.description.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setMessage("IP allowlist entry created.");
      setNewAllowlist({
        role_name: newAllowlist.role_name,
        cidr_block: "",
        description: "",
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create IP allowlist entry.");
    } finally {
      setBusy(false);
    }
  };

  const deleteAllowlistEntry = async (entryId: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/access/ip-allowlist/${entryId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("IP allowlist entry deleted.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to delete IP allowlist entry.");
    } finally {
      setBusy(false);
    }
  };

  const fetchUserSessions = async (userId: string) => {
    setSessionsLoading(true);
    try {
      const res = await apiClient(`/admin/platform/internal-users/${userId}/sessions?limit=200`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSelectedUserId(userId);
      setSelectedUserSessions(Array.isArray(data) ? data : []);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadUserSessions = async (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId("");
      setSelectedUserSessions([]);
      return;
    }
    setError("");
    setMessage("");
    try {
      await fetchUserSessions(userId);
    } catch (e: any) {
      setError(e?.message || "Failed to load user sessions.");
    }
  };

  const revokeUserSessions = async (userId: string, sessionId?: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/internal-users/${userId}/sessions/revoke`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId || "",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage(sessionId ? "Session revoked." : "All user sessions revoked.");
      await load();
      if (selectedUserId === userId) {
        await fetchUserSessions(userId);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to revoke sessions.");
    } finally {
      setBusy(false);
    }
  };

  const rotateUserTokens = async (userId: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/internal-users/${userId}/tokens/rotate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("User tokens rotated (all active sessions revoked).");
      await load();
      if (selectedUserId === userId) {
        await fetchUserSessions(userId);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to rotate user tokens.");
    } finally {
      setBusy(false);
    }
  };

  const saveMFAPolicy = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient("/admin/platform/access/policies/mfa", {
        method: "POST",
        body: JSON.stringify({
          enforce_internal_mfa: enforceInternalMFA,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Internal MFA policy updated.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update MFA policy.");
    } finally {
      setBusy(false);
    }
  };

  const saveBreakGlassPolicy = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        enabled: breakGlassDraft.enabled,
        max_duration_minutes: Math.max(1, Math.min(180, Number(breakGlassDraft.max_duration_minutes) || 30)),
        require_ticket: breakGlassDraft.require_ticket,
        cooldown_minutes: Math.max(0, Math.min(1440, Number(breakGlassDraft.cooldown_minutes) || 0)),
      };
      const res = await apiClient("/admin/platform/access/break-glass/policy", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Break-glass policy updated.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update break-glass policy.");
    } finally {
      setBusy(false);
    }
  };

  const activateBreakGlass = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!breakGlassActivation.reason.trim()) {
        throw new Error("Reason is required for break-glass activation.");
      }
      const duration = Math.max(
        1,
        Math.min(
          Number(breakGlassDraft.max_duration_minutes) || 30,
          Number(breakGlassActivation.duration_minutes) || 15,
        ),
      );
      const payload = {
        reason: breakGlassActivation.reason.trim(),
        duration_minutes: duration,
        ticket_ref: breakGlassActivation.ticket_ref.trim(),
      };
      const res = await apiClient("/admin/platform/access/break-glass/activate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setMessage(
        `Break-glass activated until ${result?.expires_at ? new Date(result.expires_at).toLocaleString() : "scheduled expiry"}.`,
      );
      setBreakGlassActivation((prev) => ({
        ...prev,
        reason: "",
        ticket_ref: "",
        duration_minutes: duration,
      }));
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to activate break-glass access.");
    } finally {
      setBusy(false);
    }
  };

  const exportAuditLogs = async (format: "csv" | "json") => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const query = new URLSearchParams();
      query.set("format", format);
      query.set("limit", "1000");
      if (auditFilters.tenant_id.trim()) query.set("tenant_id", auditFilters.tenant_id.trim());
      if (auditFilters.user_id.trim()) query.set("user_id", auditFilters.user_id.trim());
      if (auditFilters.action.trim()) query.set("action", auditFilters.action.trim());
      if (auditFilters.created_from.trim()) query.set("created_from", auditFilters.created_from.trim());
      if (auditFilters.created_to.trim()) query.set("created_to", auditFilters.created_to.trim());

      const res = await apiClient(`/admin/platform/security/audit-logs/export?${query.toString()}`);
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `platform_audit_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
      setMessage(`Audit logs exported as ${format.toUpperCase()}.`);
    } catch (e: any) {
      setError(e?.message || "Failed to export audit logs.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Internal Platform Users</h1>
        <p className="text-muted-foreground">Manage super-admin/support/finance/ops/developer access at platform scope.</p>
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
        <h2 className="text-sm font-semibold text-foreground">Create Internal User</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Full name"
            value={newUser.full_name}
            onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
          />
          <input
            type="password"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Temporary password"
            value={newUser.password}
            onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
          />
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={newUser.role_code}
            onChange={(e) => setNewUser((p) => ({ ...p, role_code: e.target.value }))}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={createUser}
            disabled={busy}
            className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Create User
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Search name/email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Platform RBAC Templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure permission matrix for internal role templates.
        </p>
        <div className="mt-3 space-y-4">
          {!rbac || rbac.roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No RBAC role templates available.</p>
          ) : (
            rbac.roles.map((role) => (
              <div key={role.role_code} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{role.role_name}</p>
                    <p className="text-xs text-muted-foreground">{role.role_code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveRolePermissions(role.role_code)}
                    disabled={busy}
                    className="rounded border border-input px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                  >
                    Save Permissions
                  </button>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {(rbac.permissions || []).map((permission) => {
                    const checked = (rbacDraft[role.role_code] || []).includes(permission.code);
                    return (
                      <label
                        key={`${role.role_code}-${permission.code}`}
                        className="flex items-start gap-2 rounded border border-border bg-background/40 px-2 py-2 text-xs text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            toggleRolePermission(role.role_code, permission.code, e.target.checked)
                          }
                        />
                        <span>
                          <span className="block font-medium">{permission.code}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {permission.description || permission.module}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">IP Allowlist (Platform Access)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Restrict platform-role access by source CIDR/IP blocks.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={newAllowlist.role_name}
            onChange={(e) => setNewAllowlist((p) => ({ ...p, role_name: e.target.value }))}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="CIDR or IP (e.g. 203.0.113.0/24)"
            value={newAllowlist.cidr_block}
            onChange={(e) => setNewAllowlist((p) => ({ ...p, cidr_block: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Description"
            value={newAllowlist.description}
            onChange={(e) => setNewAllowlist((p) => ({ ...p, description: e.target.value }))}
          />
          <button
            type="button"
            onClick={createAllowlistEntry}
            disabled={busy}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Add Allowlist
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">CIDR/IP</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {ipAllowlist.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    No allowlist entries found.
                  </td>
                </tr>
              ) : (
                ipAllowlist.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{entry.role_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{entry.cidr_block}</td>
                    <td className="px-3 py-2 text-muted-foreground">{entry.description || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => deleteAllowlistEntry(entry.id)}
                        disabled={busy}
                        className="rounded border border-red-600/40 px-2 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">MFA Enforcement Policy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Require MFA for all internal platform roles during login.
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={enforceInternalMFA}
              onChange={(e) => setEnforceInternalMFA(e.target.checked)}
            />
            Enforce MFA for internal roles (`super_admin`, `support_l1`, `support_l2`, `finance`, `ops`, `developer`)
          </label>
          <button
            type="button"
            onClick={saveMFAPolicy}
            disabled={busy}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Save MFA Policy
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: {securityPolicy?.updated_at ? new Date(securityPolicy.updated_at).toLocaleString() : "-"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Break-Glass Emergency Policy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure emergency elevated-access guardrails with cooldown and ticket requirements.
            </p>
          </div>
          <button
            type="button"
            onClick={saveBreakGlassPolicy}
            disabled={busy}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Save Break-Glass Policy
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={breakGlassDraft.enabled}
              onChange={(e) =>
                setBreakGlassDraft((prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
            />
            Enable break-glass access
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={breakGlassDraft.require_ticket}
              onChange={(e) =>
                setBreakGlassDraft((prev) => ({
                  ...prev,
                  require_ticket: e.target.checked,
                }))
              }
            />
            Require ticket reference on activation
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Max duration (minutes)</span>
            <input
              type="number"
              min={1}
              max={180}
              value={breakGlassDraft.max_duration_minutes}
              onChange={(e) =>
                setBreakGlassDraft((prev) => ({
                  ...prev,
                  max_duration_minutes: Number(e.target.value) || 1,
                }))
              }
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Cooldown (minutes)</span>
            <input
              type="number"
              min={0}
              max={1440}
              value={breakGlassDraft.cooldown_minutes}
              onChange={(e) =>
                setBreakGlassDraft((prev) => ({
                  ...prev,
                  cooldown_minutes: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: {breakGlassPolicy?.updated_at ? new Date(breakGlassPolicy.updated_at).toLocaleString() : "-"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Activate Break-Glass Access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Activation is time-bound and every request is recorded for audit.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
            placeholder="Reason (required)"
            value={breakGlassActivation.reason}
            onChange={(e) => setBreakGlassActivation((prev) => ({ ...prev, reason: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Ticket reference"
            value={breakGlassActivation.ticket_ref}
            onChange={(e) => setBreakGlassActivation((prev) => ({ ...prev, ticket_ref: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            max={breakGlassDraft.max_duration_minutes || 30}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={breakGlassActivation.duration_minutes}
            onChange={(e) =>
              setBreakGlassActivation((prev) => ({
                ...prev,
                duration_minutes: Number(e.target.value) || 1,
              }))
            }
          />
          <button
            type="button"
            onClick={activateBreakGlass}
            disabled={busy || !breakGlassDraft.enabled}
            className="rounded border border-amber-600/40 px-3 py-2 text-sm text-amber-700 hover:bg-amber-500/10 disabled:opacity-60 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
          >
            Activate
          </button>
        </div>
        {!breakGlassDraft.enabled && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-200">
            Break-glass is currently disabled by policy.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Break-Glass Events</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitored activation history with actor, reason, duration, and expiry.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="rounded border border-input px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Refresh Events
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Requested By</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Ticket</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Expires</th>
              </tr>
            </thead>
            <tbody>
              {breakGlassEvents.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={7}>
                    No break-glass events found.
                  </td>
                </tr>
              ) : (
                breakGlassEvents.map((event) => (
                  <tr key={event.id} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">
                      <p className="font-medium">{event.requested_by_name || event.requested_by || "-"}</p>
                      <p className="text-xs text-muted-foreground">{event.requested_by_email || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{event.reason || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{event.ticket_ref || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {event.duration_minutes ? `${event.duration_minutes}m` : "-"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{event.status || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {event.created_at ? new Date(event.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {event.expires_at ? new Date(event.expires_at).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Audit Log Explorer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter platform audit logs by tenant, user, action, and date window.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void exportAuditLogs("csv")}
              disabled={busy}
              className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => void exportAuditLogs("json")}
              disabled={busy}
              className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={load}
              disabled={busy}
              className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              Apply Audit Filters
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Tenant ID (UUID)"
            value={auditFilters.tenant_id}
            onChange={(e) => setAuditFilters((prev) => ({ ...prev, tenant_id: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="User ID (UUID)"
            value={auditFilters.user_id}
            onChange={(e) => setAuditFilters((prev) => ({ ...prev, user_id: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Action contains..."
            value={auditFilters.action}
            onChange={(e) => setAuditFilters((prev) => ({ ...prev, action: e.target.value }))}
          />
          <input
            type="date"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={auditFilters.created_from}
            onChange={(e) => setAuditFilters((prev) => ({ ...prev, created_from: e.target.value }))}
          />
          <input
            type="date"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={auditFilters.created_to}
            onChange={(e) => setAuditFilters((prev) => ({ ...prev, created_to: e.target.value }))}
          />
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Resource</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                    No audit records found for current filters.
                  </td>
                </tr>
              ) : (
                auditRows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      <p className="font-medium">{row.action || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.request_id || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <p>{row.tenant_name || "-"}</p>
                      <p className="text-xs">{row.tenant_id || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <p>{row.user_name || "-"}</p>
                      <p className="text-xs">{row.user_email || row.user_id || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <p>{row.resource_type || "-"}</p>
                      <p className="text-xs">{row.resource_id || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.reason_code || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Loading users...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  No internal users found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{row.full_name}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.role_code}
                      className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
                      onChange={(e) =>
                        void updateUser(row.id, { role_code: e.target.value }, "User role updated.")
                      }
                      disabled={busy}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.last_login ? new Date(row.last_login).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.active_sessions}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void updateUser(row.id, { is_active: !row.is_active }, row.is_active ? "User disabled." : "User enabled.")
                        }
                        disabled={busy}
                        className="rounded border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                      >
                        {row.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void loadUserSessions(row.id)}
                        disabled={busy || sessionsLoading}
                        className="rounded border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                      >
                        {selectedUserId === row.id ? "Hide Sessions" : "Sessions"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void revokeUserSessions(row.id)}
                        disabled={busy}
                        className="rounded border border-amber-600/40 px-2 py-1 text-xs text-amber-700 hover:bg-amber-500/10 disabled:opacity-60 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
                      >
                        Revoke All
                      </button>
                      <button
                        type="button"
                        onClick={() => void rotateUserTokens(row.id)}
                        disabled={busy}
                        className="rounded border border-red-600/40 px-2 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                      >
                        Rotate Tokens
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUserId && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Active/Recent Sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">User ID: {selectedUserId}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Expires</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessionsLoading ? (
                  <tr>
                    <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                      Loading sessions...
                    </td>
                  </tr>
                ) : selectedUserSessions.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                      No sessions found.
                    </td>
                  </tr>
                ) : (
                  selectedUserSessions.map((session) => (
                    <tr key={session.id} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{session.id}</td>
                      <td className="px-3 py-2 text-muted-foreground">{session.ip_address || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {session.created_at ? new Date(session.created_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {session.expires_at ? new Date(session.expires_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void revokeUserSessions(selectedUserId, session.id)}
                          disabled={busy}
                          className="rounded border border-red-600/40 px-2 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
