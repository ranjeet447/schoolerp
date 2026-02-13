"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  lifecycle_status: string;
  plan_code?: string;
  region?: string;
  timezone?: string;
  locale?: string;
  academic_year?: string;
  cname_target?: string;
  ssl_status?: string;
  branch_count: number;
  student_count: number;
  employee_count: number;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  address?: string;
  is_active: boolean;
};

export default function PlatformTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchAddress, setBranchAddress] = useState("");

  const [defaults, setDefaults] = useState({
    timezone: "",
    locale: "",
    academic_year: "",
    region: "",
  });
  const [domainMap, setDomainMap] = useState({
    domain: "",
    cname_target: "",
    ssl_status: "",
  });
  const [planCode, setPlanCode] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [impersonationReason, setImpersonationReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyBranchId, setBusyBranchId] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tenantRes, branchesRes] = await Promise.all([
        apiClient(`/admin/platform/tenants/${id}`),
        apiClient(`/admin/platform/tenants/${id}/branches`),
      ]);

      if (!tenantRes.ok) {
        setError("Failed to load tenant details.");
        return;
      }

      const tenantData: Tenant = await tenantRes.json();
      setTenant(tenantData);
      setDefaults({
        timezone: tenantData.timezone || "",
        locale: tenantData.locale || "",
        academic_year: tenantData.academic_year || "",
        region: tenantData.region || "",
      });
      setDomainMap({
        domain: tenantData.domain || "",
        cname_target: tenantData.cname_target || "",
        ssl_status: tenantData.ssl_status || "",
      });
      setPlanCode(tenantData.plan_code || "");

      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const action = async (label: string, fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      setMessage(`${label} completed.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || `${label} failed.`);
    } finally {
      setBusy(false);
    }
  };

  const submitDefaults = async (e: FormEvent) => {
    e.preventDefault();
    await action("Tenant defaults update", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/defaults`, {
        method: "POST",
        body: JSON.stringify(defaults),
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const submitDomainMapping = async (e: FormEvent) => {
    e.preventDefault();
    await action("Domain mapping update", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/domain`, {
        method: "POST",
        body: JSON.stringify(domainMap),
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const submitPlan = async (e: FormEvent) => {
    e.preventDefault();
    await action("Plan assignment", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/plan`, {
        method: "POST",
        body: JSON.stringify({
          plan_code: planCode,
          limits: {},
          modules: {},
          feature_flags: {},
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const createBranch = async (e: FormEvent) => {
    e.preventDefault();
    await action("Branch create", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/branches`, {
        method: "POST",
        body: JSON.stringify({
          name: branchName,
          code: branchCode,
          address: branchAddress,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setBranchName("");
      setBranchCode("");
      setBranchAddress("");
    });
  };

  const resetAdminPassword = async () => {
    await action("Admin password reset", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/reset-admin-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newAdminPassword }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewAdminPassword("");
    });
  };

  const forceLogoutUsers = async () => {
    await action("Force logout", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/force-logout`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const impersonateTenantAdmin = async () => {
    await action("Impersonation", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/impersonate`, {
        method: "POST",
        body: JSON.stringify({ reason: impersonationReason, duration_minutes: 30 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.setItem("impersonator_auth_token", localStorage.getItem("auth_token") || "");
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_role", "tenant_admin");
      localStorage.setItem("tenant_id", data.target_tenant_id);
      localStorage.setItem("user_id", data.target_user_id);
      localStorage.setItem("user_email", data.target_user_email);
      localStorage.setItem("user_name", `${data.target_tenant_name} Admin`);
      window.location.href = "/admin/dashboard";
    });
  };

  if (loading) return <div className="text-slate-400">Loading tenant details...</div>;
  if (!tenant) return <div className="text-red-400">Tenant not found.</div>;

  const toggleBranchActive = async (branch: Branch) => {
    setBusyBranchId(branch.id);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/tenants/${id}/branches/${branch.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !branch.is_active }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage(`Branch ${branch.is_active ? "deactivated" : "activated"}.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to update branch.");
    } finally {
      setBusyBranchId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">{tenant.name}</h1>
          <p className="text-slate-400">
            {tenant.subdomain} • {tenant.lifecycle_status} • {tenant.plan_code || "no-plan"}
          </p>
        </div>
        <Link
          href="/platform/tenants"
          className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Back to Tenants
        </Link>
      </div>

      {message && <div className="rounded border border-emerald-700 bg-emerald-950/30 p-3 text-sm text-emerald-200">{message}</div>}
      {error && <div className="rounded border border-red-700 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold text-white">Tenant Defaults</h2>
          <form onSubmit={submitDefaults} className="mt-3 space-y-2">
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Timezone" value={defaults.timezone} onChange={(e) => setDefaults((p) => ({ ...p, timezone: e.target.value }))} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Locale" value={defaults.locale} onChange={(e) => setDefaults((p) => ({ ...p, locale: e.target.value }))} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Academic Year (e.g. 2025-26)" value={defaults.academic_year} onChange={(e) => setDefaults((p) => ({ ...p, academic_year: e.target.value }))} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Region" value={defaults.region} onChange={(e) => setDefaults((p) => ({ ...p, region: e.target.value }))} />
            <button disabled={busy} className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Save Defaults</button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold text-white">Domain Mapping</h2>
          <form onSubmit={submitDomainMapping} className="mt-3 space-y-2">
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Custom Domain" value={domainMap.domain} onChange={(e) => setDomainMap((p) => ({ ...p, domain: e.target.value }))} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="CNAME Target" value={domainMap.cname_target} onChange={(e) => setDomainMap((p) => ({ ...p, cname_target: e.target.value }))} />
            <select className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={domainMap.ssl_status} onChange={(e) => setDomainMap((p) => ({ ...p, ssl_status: e.target.value }))}>
              <option value="">SSL status</option>
              <option value="pending">Pending</option>
              <option value="provisioning">Provisioning</option>
              <option value="active">Active</option>
              <option value="failed">Failed</option>
            </select>
            <button disabled={busy} className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Save Domain Mapping</button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold text-white">Plan Assignment</h2>
          <form onSubmit={submitPlan} className="mt-3 flex gap-2">
            <input className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Plan code (basic/pro/enterprise)" value={planCode} onChange={(e) => setPlanCode(e.target.value)} />
            <button disabled={busy} className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Assign</button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold text-white">Security Actions</h2>
          <div className="mt-3 space-y-2">
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="New tenant admin password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} />
            <button onClick={resetAdminPassword} disabled={busy || !newAdminPassword} className="mr-2 rounded border border-amber-700 px-3 py-2 text-sm text-amber-200 disabled:opacity-50">Reset Admin Password</button>
            <button onClick={forceLogoutUsers} disabled={busy} className="rounded border border-red-700 px-3 py-2 text-sm text-red-200 disabled:opacity-50">Force Logout All Users</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-semibold text-white">Impersonation (Guardrail: reason required)</h2>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <input
            className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="Why do you need to impersonate this tenant admin?"
            value={impersonationReason}
            onChange={(e) => setImpersonationReason(e.target.value)}
          />
          <button onClick={impersonateTenantAdmin} disabled={busy || !impersonationReason.trim()} className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            Login As Tenant Admin
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-semibold text-white">Branches</h2>
        <form onSubmit={createBranch} className="mt-3 grid gap-2 md:grid-cols-4">
          <input className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
          <input className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
          <input className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Address" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
          <button disabled={busy} className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Create Branch</button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-300">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Code</th>
                <th className="py-2">Address</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={5}>
                    No branches yet.
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} className="border-t border-slate-800">
                    <td className="py-2 text-white">{b.name}</td>
                    <td className="py-2 text-slate-300">{b.code}</td>
                    <td className="py-2 text-slate-300">{b.address || "-"}</td>
                    <td className="py-2 text-slate-300">{b.is_active ? "Active" : "Inactive"}</td>
                    <td className="py-2">
                      <button
                        onClick={() => toggleBranchActive(b)}
                        disabled={busy || busyBranchId === b.id}
                        className={`rounded border px-3 py-1 text-xs disabled:opacity-60 ${
                          b.is_active
                            ? "border-amber-700 text-amber-200 hover:bg-amber-900/20"
                            : "border-emerald-700 text-emerald-200 hover:bg-emerald-900/20"
                        }`}
                      >
                        {b.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
