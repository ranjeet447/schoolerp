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
  white_label: boolean;
  brand_primary_color?: string;
  brand_name_override?: string;
  brand_logo_url?: string;
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
  const [branding, setBranding] = useState({
    white_label: false,
    primary_color: "#4f46e5",
    name_override: "",
    logo_url: "",
  });
  const [planCode, setPlanCode] = useState("");
  const [planModulesText, setPlanModulesText] = useState("{}");
  const [planLimitsText, setPlanLimitsText] = useState("{}");
  const [planFlagsText, setPlanFlagsText] = useState("{}");
  const [prorationPolicy, setProrationPolicy] = useState("prorated");
  const [planEffectiveAt, setPlanEffectiveAt] = useState("");
  const [limitOverrideKey, setLimitOverrideKey] = useState("students");
  const [limitOverrideValue, setLimitOverrideValue] = useState("");
  const [limitOverrideExpiresAt, setLimitOverrideExpiresAt] = useState("");
  const [trialDays, setTrialDays] = useState("14");
  const [renewAfterDays, setRenewAfterDays] = useState("30");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [impersonationReason, setImpersonationReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyBranchId, setBusyBranchId] = useState("");

  const parseJSONObject = (raw: string, label: string) => {
    try {
      const value = JSON.parse(raw || "{}");
      if (!value || Array.isArray(value) || typeof value !== "object") {
        throw new Error(`${label} must be a JSON object.`);
      }
      return value;
    } catch {
      throw new Error(`${label} must be valid JSON.`);
    }
  };

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
      setBranding({
        white_label: tenantData.white_label || false,
        primary_color: tenantData.brand_primary_color || "#4f46e5",
        name_override: tenantData.brand_name_override || "",
        logo_url: tenantData.brand_logo_url || "",
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

  const submitBranding = async (e: FormEvent) => {
    e.preventDefault();
    await action("Branding update", async () => {
      const res = await apiClient(`/admin/platform/tenants/${id}/branding`, {
        method: "POST",
        body: JSON.stringify({
          white_label: branding.white_label,
          branding: {
            primary_color: branding.primary_color,
            name_override: branding.name_override,
            logo_url: branding.logo_url,
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const submitPlan = async (e: FormEvent) => {
    e.preventDefault();
    await action("Plan assignment", async () => {
      const modules = parseJSONObject(planModulesText, "Modules override");
      const limits = parseJSONObject(planLimitsText, "Limits override");
      const featureFlags = parseJSONObject(planFlagsText, "Feature flags override");

      const res = await apiClient(`/admin/platform/tenants/${id}/plan`, {
        method: "POST",
        body: JSON.stringify({
          plan_code: planCode,
          limits,
          modules,
          feature_flags: featureFlags,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const applyPlanChange = async () => {
    await action("Plan change", async () => {
      if (!planCode.trim()) {
        throw new Error("Plan code is required.");
      }

      const payload: Record<string, unknown> = {
        plan_code: planCode.trim(),
        proration_policy: prorationPolicy,
        reason: "manual_plan_change",
      };
      if (planEffectiveAt.trim()) {
        payload.effective_at = new Date(planEffectiveAt).toISOString();
      }

      const res = await apiClient(`/admin/platform/tenants/${id}/plan-change`, {
        method: "POST",
        body: JSON.stringify(payload),
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

  const applyLimitOverride = async () => {
    await action("Limit override", async () => {
      const limitValue = Number(limitOverrideValue);
      if (!Number.isFinite(limitValue) || limitValue < 0) {
        throw new Error("Limit value must be a non-negative number.");
      }

      const payload: Record<string, unknown> = {
        limit_key: limitOverrideKey,
        limit_value: Math.floor(limitValue),
      };
      if (limitOverrideExpiresAt.trim()) {
        payload.expires_at = new Date(limitOverrideExpiresAt).toISOString();
      }

      const res = await apiClient(`/admin/platform/tenants/${id}/limit-overrides`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setLimitOverrideValue("");
      setLimitOverrideExpiresAt("");
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

  const manageTrialLifecycle = async (lifecycleAction: "start" | "extend" | "convert_paid") => {
    await action("Trial lifecycle update", async () => {
      const days = Number(trialDays || "14");
      const renewDays = Number(renewAfterDays || "30");

      const res = await apiClient(`/admin/platform/tenants/${id}/trial`, {
        method: "POST",
        body: JSON.stringify({
          action: lifecycleAction,
          days: Number.isFinite(days) ? Math.max(1, Math.floor(days)) : 14,
          renew_after_days: Number.isFinite(renewDays) ? Math.max(1, Math.floor(renewDays)) : 30,
        }),
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
      const now = new Date().toISOString();
      localStorage.setItem("impersonator_auth_token", localStorage.getItem("auth_token") || "");
      localStorage.setItem("impersonator_user_role", localStorage.getItem("user_role") || "");
      localStorage.setItem("impersonator_user_id", localStorage.getItem("user_id") || "");
      localStorage.setItem("impersonator_user_email", localStorage.getItem("user_email") || "");
      localStorage.setItem("impersonator_user_name", localStorage.getItem("user_name") || "");
      localStorage.setItem("impersonator_tenant_id", localStorage.getItem("tenant_id") || "");
      localStorage.setItem("impersonation_started_at", now);
      localStorage.setItem("impersonation_reason", impersonationReason.trim());
      localStorage.setItem("impersonation_target_tenant_id", data.target_tenant_id);
      localStorage.setItem("impersonation_target_user_id", data.target_user_id);
      localStorage.setItem("impersonation_target_user_email", data.target_user_email);
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_role", "tenant_admin");
      localStorage.setItem("tenant_id", data.target_tenant_id);
      localStorage.setItem("user_id", data.target_user_id);
      localStorage.setItem("user_email", data.target_user_email);
      localStorage.setItem("user_name", `${data.target_tenant_name} Admin`);
      window.location.href = "/admin/dashboard";
    });
  };

  if (loading) return <div className="text-muted-foreground">Loading tenant details...</div>;
  if (!tenant) return <div className="text-destructive">Tenant not found.</div>;

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
          <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
          <p className="text-muted-foreground">
            {tenant.subdomain} • {tenant.lifecycle_status} • {tenant.plan_code || "no-plan"}
          </p>
        </div>
        <Link
          href="/platform/tenants"
          className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Back to Tenants
        </Link>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">Tenant Defaults</h2>
          <form onSubmit={submitDefaults} className="mt-3 space-y-2">
            <input className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Timezone" value={defaults.timezone} onChange={(e) => setDefaults((p) => ({ ...p, timezone: e.target.value }))} />
            <input className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Locale" value={defaults.locale} onChange={(e) => setDefaults((p) => ({ ...p, locale: e.target.value }))} />
            <input className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Academic Year (e.g. 2025-26)" value={defaults.academic_year} onChange={(e) => setDefaults((p) => ({ ...p, academic_year: e.target.value }))} />
            <input className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Region" value={defaults.region} onChange={(e) => setDefaults((p) => ({ ...p, region: e.target.value }))} />
            <button disabled={busy} className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Save Defaults</button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">Domain Mapping</h2>
          <form onSubmit={submitDomainMapping} className="mt-3 space-y-2">
            <input className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Custom Domain" value={domainMap.domain} onChange={(e) => setDomainMap((p) => ({ ...p, domain: e.target.value }))} />
            <input className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="CNAME Target" value={domainMap.cname_target} onChange={(e) => setDomainMap((p) => ({ ...p, cname_target: e.target.value }))} />
            <select className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground" value={domainMap.ssl_status} onChange={(e) => setDomainMap((p) => ({ ...p, ssl_status: e.target.value }))}>
              <option value="">SSL status</option>
              <option value="pending">Pending</option>
              <option value="provisioning">Provisioning</option>
              <option value="active">Active</option>
              <option value="failed">Failed</option>
            </select>
            <button disabled={busy} className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Save Domain Mapping</button>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">Branding</h2>
        <form onSubmit={submitBranding} className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
            <input
              type="checkbox"
              checked={branding.white_label}
              onChange={(e) => setBranding((p) => ({ ...p, white_label: e.target.checked }))}
            />
            White label (remove SchoolERP branding)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={branding.primary_color}
              onChange={(e) => setBranding((p) => ({ ...p, primary_color: e.target.value }))}
              className="h-10 w-14 bg-transparent"
              title="Primary color"
            />
            <input
              className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="#4f46e5"
              value={branding.primary_color}
              onChange={(e) => setBranding((p) => ({ ...p, primary_color: e.target.value }))}
            />
          </div>
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Name override (display)"
            value={branding.name_override}
            onChange={(e) => setBranding((p) => ({ ...p, name_override: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
            placeholder="Logo URL"
            value={branding.logo_url}
            onChange={(e) => setBranding((p) => ({ ...p, logo_url: e.target.value }))}
          />
          <div className="md:col-span-2">
            <button disabled={busy} className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              Save Branding
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">Plan Assignment</h2>
          <form onSubmit={submitPlan} className="mt-3 space-y-2">
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Plan code (basic/pro/enterprise)"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
            />
            <textarea
              rows={3}
              className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground"
              placeholder='Modules override JSON, e.g. {"attendance":true}'
              value={planModulesText}
              onChange={(e) => setPlanModulesText(e.target.value)}
            />
            <textarea
              rows={3}
              className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground"
              placeholder='Limits override JSON, e.g. {"students":1200}'
              value={planLimitsText}
              onChange={(e) => setPlanLimitsText(e.target.value)}
            />
            <textarea
              rows={3}
              className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground"
              placeholder='Feature flags override JSON, e.g. {"beta_transport":true}'
              value={planFlagsText}
              onChange={(e) => setPlanFlagsText(e.target.value)}
            />
            <button
              disabled={busy}
              className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Assign Plan & Overrides
            </button>

            <div className="mt-2 rounded border border-border bg-background/40 p-3">
              <h3 className="text-sm font-medium text-foreground">Upgrade / Downgrade Plan</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Apply plan change policy with immediate, next-cycle, no-proration, or prorated behavior metadata.
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <select
                  className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={prorationPolicy}
                  onChange={(e) => setProrationPolicy(e.target.value)}
                >
                  <option value="prorated">prorated</option>
                  <option value="immediate">immediate</option>
                  <option value="next_cycle">next_cycle</option>
                  <option value="none">none</option>
                </select>
                <input
                  type="datetime-local"
                  className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={planEffectiveAt}
                  onChange={(e) => setPlanEffectiveAt(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !planCode.trim()}
                  onClick={applyPlanChange}
                  className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  Apply Plan Change
                </button>
              </div>
            </div>

            <div className="mt-2 rounded border border-border bg-background/40 p-3">
              <h3 className="text-sm font-medium text-foreground">Tenant Limit Override</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Set permanent overrides by leaving expiry empty, or temporary overrides with an expiry date/time.
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-4">
                <select
                  className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={limitOverrideKey}
                  onChange={(e) => setLimitOverrideKey(e.target.value)}
                >
                  <option value="students">students</option>
                  <option value="staff">staff</option>
                  <option value="storage_mb">storage_mb</option>
                </select>
                <input
                  type="number"
                  min={0}
                  className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="Limit value"
                  value={limitOverrideValue}
                  onChange={(e) => setLimitOverrideValue(e.target.value)}
                />
                <input
                  type="datetime-local"
                  className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={limitOverrideExpiresAt}
                  onChange={(e) => setLimitOverrideExpiresAt(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !limitOverrideValue.trim()}
                  onClick={applyLimitOverride}
                  className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  Apply Override
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">Security Actions</h2>
          <div className="mt-3 space-y-2">
            <input className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="New tenant admin password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} />
            <button onClick={resetAdminPassword} disabled={busy || !newAdminPassword} className="mr-2 rounded border border-amber-600/40 px-3 py-2 text-sm text-amber-700 hover:bg-amber-500/10 disabled:opacity-50 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20">Reset Admin Password</button>
            <button onClick={forceLogoutUsers} disabled={busy} className="rounded border border-red-600/40 px-3 py-2 text-sm text-red-700 hover:bg-red-500/10 disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20">Force Logout All Users</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">Trial Lifecycle</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start a trial, extend trial duration, or convert tenant to paid active subscription.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            placeholder="Trial days"
          />
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={renewAfterDays}
            onChange={(e) => setRenewAfterDays(e.target.value)}
            placeholder="Renew after days"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => manageTrialLifecycle("start")}
            className="rounded border border-indigo-600/40 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-500/10 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
          >
            Start Trial
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => manageTrialLifecycle("extend")}
            className="rounded border border-amber-600/40 px-3 py-2 text-sm text-amber-700 hover:bg-amber-500/10 disabled:opacity-60 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
          >
            Extend Trial
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => manageTrialLifecycle("convert_paid")}
            className="rounded border border-emerald-600/40 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20 md:col-span-4"
          >
            Convert To Paid
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">Impersonation (Guardrail: reason required)</h2>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <input
            className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Why do you need to impersonate this tenant admin?"
            value={impersonationReason}
            onChange={(e) => setImpersonationReason(e.target.value)}
          />
          <button onClick={impersonateTenantAdmin} disabled={busy || !impersonationReason.trim()} className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            Login As Tenant Admin
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">Tenant Region / Shard Migration</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Automated tenant migration is not available in this deployment. Use managed support workflow for controlled migrations.
        </p>
        <button
          type="button"
          disabled
          className="mt-3 cursor-not-allowed rounded border border-input px-3 py-2 text-sm text-muted-foreground opacity-70"
        >
          Request Managed Migration (Unavailable)
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">Branches</h2>
        <form onSubmit={createBranch} className="mt-3 grid gap-2 md:grid-cols-4">
          <input className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
          <input className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Code" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
          <input className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Address" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
          <button disabled={busy} className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Create Branch</button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
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
                  <td className="py-3 text-muted-foreground" colSpan={5}>
                    No branches yet.
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="py-2 text-foreground">{b.name}</td>
                    <td className="py-2 text-muted-foreground">{b.code}</td>
                    <td className="py-2 text-muted-foreground">{b.address || "-"}</td>
                    <td className="py-2 text-muted-foreground">{b.is_active ? "Active" : "Inactive"}</td>
                    <td className="py-2">
                      <button
                        onClick={() => toggleBranchActive(b)}
                        disabled={busy || busyBranchId === b.id}
                        className={`rounded border px-3 py-1 text-xs disabled:opacity-60 ${
                          b.is_active
                            ? "border-amber-600/40 text-amber-700 hover:bg-amber-500/10 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
                            : "border-emerald-600/40 text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
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
