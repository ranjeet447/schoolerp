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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      query.set("limit", "200");
      if (search.trim()) query.set("q", search.trim());
      if (roleFilter.trim()) query.set("role_code", roleFilter.trim());
      if (activeFilter === "true" || activeFilter === "false") query.set("is_active", activeFilter);

      const res = await apiClient(`/admin/platform/internal-users?${query.toString()}`);
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
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
