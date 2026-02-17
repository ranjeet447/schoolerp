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

      const [usersRes, rbacRes, allowlistRes] = await Promise.all([
        apiClient(`/admin/platform/internal-users?${query.toString()}`),
        apiClient("/admin/platform/rbac/templates"),
        apiClient("/admin/platform/access/ip-allowlist"),
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
