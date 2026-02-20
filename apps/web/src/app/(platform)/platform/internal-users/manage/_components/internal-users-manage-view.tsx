"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@schoolerp/ui";
import { Users, Shield, Lock, FileSearch, ArrowRight } from "lucide-react";
import { UserManagement } from "../../_components/user-management";
import { RbacMatrix } from "../../_components/rbac-matrix";
import { SecurityPolicies } from "../../_components/security-policies";
import { AuditTrail } from "../../_components/audit-trail";

export type InternalUsersManageTab = "users" | "roles" | "permissions" | "security" | "audit";

export function isInternalUsersManageTab(value: string): value is InternalUsersManageTab {
  return value === "users" || value === "roles" || value === "permissions" || value === "security" || value === "audit";
}

/* ── Type Definitions ────────────────────────────────── */

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

type PlatformRBACMatrix = {
  roles: Array<{ role_code: string; role_name: string; permission_codes: string[] }>;
  permissions: Array<{ code: string; module: string; description: string }>;
};

type PlatformIPAllowlistEntry = {
  id: string;
  role_name: string;
  cidr_block: string;
  description?: string;
  created_by?: string;
  created_at: string;
};

type PlatformBreakGlassPolicy = {
  enabled: boolean;
  max_duration_minutes: number;
  require_ticket: boolean;
  cooldown_minutes: number;
  updated_at?: string;
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

/* ── Main Page ───────────────────────────────────────── */

export function InternalUsersManageView({ activeTab }: { activeTab: InternalUsersManageTab }) {
  const router = useRouter();
  /* State */
  const [rows, setRows] = useState<PlatformInternalUser[]>([]);
  const [rbac, setRbac] = useState<PlatformRBACMatrix | null>(null);
  const [rbacDraft, setRbacDraft] = useState<Record<string, string[]>>({});
  const [ipAllowlist, setIpAllowlist] = useState<PlatformIPAllowlistEntry[]>([]);
  const [enforceInternalMFA, setEnforceInternalMFA] = useState(false);
  const [breakGlassDraft, setBreakGlassDraft] = useState({
    enabled: false,
    max_duration_minutes: 30,
    require_ticket: true,
    cooldown_minutes: 60,
  });
  const [breakGlassEvents, setBreakGlassEvents] = useState<any[]>([]);
  const [auditRows, setAuditRows] = useState<PlatformAuditLogRow[]>([]);
  const [auditFilters, setAuditFilters] = useState({
    tenant_id: "",
    user_id: "",
    action: "",
    created_from: "",
    created_to: "",
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* Data Loading */

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const auditQuery = new URLSearchParams({ limit: "150" });
      if (auditFilters.tenant_id.trim()) auditQuery.set("tenant_id", auditFilters.tenant_id.trim());
      if (auditFilters.user_id.trim()) auditQuery.set("user_id", auditFilters.user_id.trim());
      if (auditFilters.action.trim()) auditQuery.set("action", auditFilters.action.trim());
      if (auditFilters.created_from.trim()) auditQuery.set("created_from", auditFilters.created_from.trim());
      if (auditFilters.created_to.trim()) auditQuery.set("created_to", auditFilters.created_to.trim());

      const [usersRes, rbacRes, allowlistRes, mfaPolicyRes, bgPolicyRes, bgEventsRes, auditRes] = await Promise.all([
        apiClient("/admin/platform/internal-users?limit=200"),
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
      }

      if (allowlistRes.ok) {
        const d = await allowlistRes.json();
        setIpAllowlist(Array.isArray(d) ? d : []);
      }

      if (mfaPolicyRes.ok) {
        const p = await mfaPolicyRes.json();
        setEnforceInternalMFA(Boolean(p.enforce_internal_mfa));
      }

      if (bgPolicyRes.ok) {
        const p: PlatformBreakGlassPolicy = await bgPolicyRes.json();
        setBreakGlassDraft({
          enabled: Boolean(p.enabled),
          max_duration_minutes: Number(p.max_duration_minutes) || 30,
          require_ticket: Boolean(p.require_ticket),
          cooldown_minutes: Number(p.cooldown_minutes) || 0,
        });
      }

      if (bgEventsRes.ok) {
        const d = await bgEventsRes.json();
        setBreakGlassEvents(Array.isArray(d) ? d : []);
      }

      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditRows(Array.isArray(d) ? d : []);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Handlers */

  const withBusy = async (fn: () => Promise<void>, successMsg?: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      if (successMsg) setMessage(successMsg);
      await load();
    } catch (e: any) {
      setError(e?.message || "Operation failed.");
    } finally {
      setBusy(false);
    }
  };

  const createUser = async (userData: any) => {
    await withBusy(async () => {
      const res = await apiClient("/admin/platform/internal-users", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      if (!res.ok) throw new Error(await res.text());
    }, "User created successfully.");
  };

  const updateUser = async (userId: string, payload: any, label: string) => {
    await withBusy(async () => {
      const res = await apiClient(`/admin/platform/internal-users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
    }, label);
  };

  const rotateTokens = async (userId: string) => {
    await withBusy(async () => {
      const res = await apiClient(`/admin/platform/internal-users/${userId}/tokens/rotate`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
    }, "Credentials rotated.");
  };

  const revokeSessions = async (userId: string) => {
    await withBusy(async () => {
      const res = await apiClient(`/admin/platform/internal-users/${userId}/sessions/revoke`, {
        method: "POST",
        body: JSON.stringify({ session_id: "" }),
      });
      if (!res.ok) throw new Error(await res.text());
    }, "Sessions revoked.");
  };

  const toggleRolePermission = (roleCode: string, permCode: string, checked: boolean) => {
    setRbacDraft((prev) => {
      const current = new Set(prev[roleCode] || []);
      if (checked) current.add(permCode);
      else current.delete(permCode);
      return { ...prev, [roleCode]: Array.from(current).sort() };
    });
  };

  const saveRolePermissions = async (roleCode: string) => {
    await withBusy(async () => {
      const res = await apiClient(`/admin/platform/rbac/templates/${roleCode}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permission_codes: rbacDraft[roleCode] || [] }),
      });
      if (!res.ok) throw new Error(await res.text());
    }, `Permissions saved for ${roleCode}.`);
  };

  const addAllowlist = async (entry: any) => {
    await withBusy(async () => {
      const res = await apiClient("/admin/platform/access/ip-allowlist", {
        method: "POST",
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(await res.text());
    }, "IP allowlist entry added.");
  };

  const deleteAllowlist = async (id: string) => {
    await withBusy(async () => {
      const res = await apiClient(`/admin/platform/access/ip-allowlist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    }, "IP allowlist entry removed.");
  };

  const saveMFA = async () => {
    await withBusy(async () => {
      const res = await apiClient("/admin/platform/access/policies/mfa", {
        method: "POST",
        body: JSON.stringify({ enforce_internal_mfa: enforceInternalMFA }),
      });
      if (!res.ok) throw new Error(await res.text());
    }, "MFA policy updated.");
  };

  const saveBreakGlassPolicy = async () => {
    await withBusy(async () => {
      const res = await apiClient("/admin/platform/access/break-glass/policy", {
        method: "POST",
        body: JSON.stringify(breakGlassDraft),
      });
      if (!res.ok) throw new Error(await res.text());
    }, "Break-glass policy updated.");
  };

  const activateBreakGlass = async (data: any) => {
    await withBusy(async () => {
      if (!data.reason?.trim()) throw new Error("Reason is required.");
      const res = await apiClient("/admin/platform/access/break-glass/activate", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
    }, "Break-glass protocol activated.");
  };

  const exportAudit = async (format: "csv" | "json") => {
    await withBusy(async () => {
      const query = new URLSearchParams({ format, limit: "1000" });
      Object.entries(auditFilters).forEach(([k, v]) => { if (v.trim()) query.set(k, v.trim()); });
      const res = await apiClient(`/admin/platform/security/audit-logs/export?${query.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_${new Date().toISOString().replace(/[:.]/g, "-")}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, `Audit exported as ${format.toUpperCase()}.`);
  };

  /* Render */

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4">
        <Link href="/platform/internal-users" className="flex items-center text-xs font-black text-primary hover:underline gap-1 uppercase tracking-widest">
          <ArrowRight className="h-3 w-3 rotate-180" />
          Back to Access Governance
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Access Control Center</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">
            Centralized command for identity governance, role-based permissions, security policies,
            and compliance audit trails.
          </p>
        </div>
      </div>

      {/* Toasts */}
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {error}
        </div>
      )}

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isInternalUsersManageTab(value)) {
            router.push(`/platform/internal-users/manage/${value}`);
          }
        }}
        className="w-full"
      >
        <TabsList className="mb-8 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="users" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            User Directory
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Lock className="h-4 w-4" />
            Security Policies
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileSearch className="h-4 w-4" />
            Audit Trails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement
            users={rows}
            onReload={load}
            onUpdate={updateUser}
            onCreate={createUser}
            onRotateTokens={rotateTokens}
            onRevokeSessions={revokeSessions}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="roles">
          <RbacMatrix
            rbac={rbac}
            rbacDraft={rbacDraft}
            onToggle={toggleRolePermission}
            onSave={saveRolePermissions}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="permissions">
          <RbacMatrix
            rbac={rbac}
            rbacDraft={rbacDraft}
            onToggle={toggleRolePermission}
            onSave={saveRolePermissions}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityPolicies
            ipAllowlist={ipAllowlist}
            onAddAllowlist={addAllowlist}
            onDeleteAllowlist={deleteAllowlist}
            enforceMFA={enforceInternalMFA}
            onToggleMFA={setEnforceInternalMFA}
            onSaveMFA={saveMFA}
            breakGlassDraft={breakGlassDraft}
            setBreakGlassDraft={setBreakGlassDraft}
            onSaveBreakGlassPolicy={saveBreakGlassPolicy}
            onActivateBreakGlass={activateBreakGlass}
            breakGlassEvents={breakGlassEvents}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTrail
            rows={auditRows}
            filters={auditFilters}
            setFilters={setAuditFilters}
            onExport={exportAudit}
            onReload={load}
            busy={busy}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
