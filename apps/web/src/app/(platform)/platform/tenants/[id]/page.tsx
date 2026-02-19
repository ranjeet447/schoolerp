"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent, 
  Button, 
  Input, 
  Label, 
  Textarea, 
  Badge,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@schoolerp/ui";
import { PlanSelect } from "@/components/ui/plan-select";
import { Settings, CreditCard, GitBranch, Database } from "lucide-react";

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

type BillingControls = {
  subscription_status: string;
  dunning_rules?: {
    retry_cadence_days?: number[];
    channels?: string[];
    max_retries?: number;
    grace_period_days?: number;
    lock_on_failure?: boolean;
  };
  grace_period_ends_at?: string;
  billing_locked: boolean;
  lock_reason?: string;
  billing_frozen: boolean;
  freeze_reason?: string;
  freeze_incident_id?: string;
  freeze_ends_at?: string;
  updated_at?: string;
};

type TenantExportRequest = {
  id: string;
  tenant_id: string;
  status: string;
  requested_by: string;
  requested_by_name?: string;
  requested_by_email?: string;
  payload?: {
    reason?: string;
    include_users?: boolean;
    include_tables?: string[];
    exclude_tables?: string[];
    format?: string;
    requested_at?: string;
    started_at?: string;
    completed_at?: string;
    error?: string;
    tables?: Record<string, number>;
    total_rows?: number;
  };
  created_at: string;
  completed_at?: string;
};

type TenantDeletionRequest = {
  id: string;
  tenant_id: string;
  status: string;
  requested_by: string;
  requested_by_name?: string;
  requested_by_email?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_by_email?: string;
  payload?: {
    reason?: string;
    notes?: string;
    cooldown_hours?: number;
    requested_at?: string;
    approved_at?: string;
    execute_after?: string;
    executed_at?: string;
  };
  created_at: string;
  approved_at?: string;
  execute_after?: string;
};

export default function PlatformTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [billingControls, setBillingControls] = useState<BillingControls | null>(null);
  const [exports, setExports] = useState<TenantExportRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<TenantDeletionRequest[]>([]);
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
  const [limitOverrideIncidentId, setLimitOverrideIncidentId] = useState("");
  const [limitOverrideReason, setLimitOverrideReason] = useState("");
  const [trialDays, setTrialDays] = useState("14");
  const [renewAfterDays, setRenewAfterDays] = useState("30");
  const [dunningRetryCadence, setDunningRetryCadence] = useState("3,7,14");
  const [dunningChannels, setDunningChannels] = useState("email");
  const [dunningMaxRetries, setDunningMaxRetries] = useState("3");
  const [dunningGraceDays, setDunningGraceDays] = useState("7");
  const [dunningLockOnFailure, setDunningLockOnFailure] = useState(true);
  const [billingLockReason, setBillingLockReason] = useState("");
  const [billingLockGraceDays, setBillingLockGraceDays] = useState("7");
  const [billingFreezeReason, setBillingFreezeReason] = useState("");
  const [billingFreezeEndsAt, setBillingFreezeEndsAt] = useState("");
  const [billingFreezeIncidentId, setBillingFreezeIncidentId] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [impersonationReason, setImpersonationReason] = useState("");
  const [exportReason, setExportReason] = useState("");
  const [exportIncludeUsers, setExportIncludeUsers] = useState(true);
  const [exportIncludeTables, setExportIncludeTables] = useState("");
  const [exportExcludeTables, setExportExcludeTables] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionCooldownHours, setDeletionCooldownHours] = useState("24");
  const [deletionConfirmation, setDeletionConfirmation] = useState("");
  const [deletionReviewNotes, setDeletionReviewNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [busyBranchId, setBusyBranchId] = useState("");
  const [busyExportId, setBusyExportId] = useState("");
  const [busyDeletionRequestId, setBusyDeletionRequestId] = useState("");

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
      const [tenantRes, branchesRes, billingRes, exportsRes, deletionsRes] = await Promise.all([
        apiClient(`/admin/platform/tenants/${id}`),
        apiClient(`/admin/platform/tenants/${id}/branches`),
        apiClient(`/admin/platform/tenants/${id}/billing-controls`),
        apiClient(`/admin/platform/tenants/${id}/exports?limit=20`),
        apiClient(`/admin/platform/tenants/${id}/deletion-requests?limit=20`),
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
      if (billingRes.ok) {
        const billingData: BillingControls = await billingRes.json();
        setBillingControls(billingData);
        const rules = billingData.dunning_rules || {};
        setDunningRetryCadence(
          Array.isArray(rules.retry_cadence_days) && rules.retry_cadence_days.length > 0
            ? rules.retry_cadence_days.join(",")
            : "3,7,14"
        );
        setDunningChannels(
          Array.isArray(rules.channels) && rules.channels.length > 0 ? rules.channels.join(",") : "email"
        );
        setDunningMaxRetries(String(rules.max_retries || 3));
        setDunningGraceDays(String(rules.grace_period_days || 7));
        setDunningLockOnFailure(rules.lock_on_failure !== false);
      } else {
        setBillingControls(null);
      }

      if (exportsRes.ok) {
        const exportData = await exportsRes.json();
        setExports(Array.isArray(exportData) ? exportData : []);
      } else {
        setExports([]);
      }

      if (deletionsRes.ok) {
        const deletionData = await deletionsRes.json();
        setDeletionRequests(Array.isArray(deletionData) ? deletionData : []);
      } else {
        setDeletionRequests([]);
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
      if (!limitOverrideReason.trim()) {
        throw new Error("Reason is required for limit overrides.");
      }

      const payload: Record<string, unknown> = {
        limit_key: limitOverrideKey,
        limit_value: Math.floor(limitValue),
        reason: limitOverrideReason.trim(),
      };
      if (limitOverrideExpiresAt.trim()) {
        payload.expires_at = new Date(limitOverrideExpiresAt).toISOString();
      }
      if (limitOverrideIncidentId.trim()) {
        payload.incident_id = limitOverrideIncidentId.trim();
      }

      const res = await apiClient(`/admin/platform/tenants/${id}/limit-overrides`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setLimitOverrideValue("");
      setLimitOverrideExpiresAt("");
      setLimitOverrideIncidentId("");
      setLimitOverrideReason("");
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

  const saveDunningRules = async () => {
    await action("Dunning rules update", async () => {
      const retryCadenceDays = dunningRetryCadence
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0)
        .map((v) => Math.floor(v));
      const channels = dunningChannels
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter((v) => v.length > 0);
      const maxRetries = Math.floor(Number(dunningMaxRetries || "3"));
      const gracePeriodDays = Math.floor(Number(dunningGraceDays || "7"));

      if (retryCadenceDays.length === 0) {
        throw new Error("Retry cadence must include at least one positive day value.");
      }
      if (channels.length === 0) {
        throw new Error("At least one dunning channel is required.");
      }
      if (!Number.isFinite(maxRetries) || maxRetries <= 0) {
        throw new Error("Max retries must be a positive number.");
      }
      if (!Number.isFinite(gracePeriodDays) || gracePeriodDays <= 0) {
        throw new Error("Grace period days must be a positive number.");
      }

      const res = await apiClient(`/admin/platform/tenants/${id}/dunning-rules`, {
        method: "POST",
        body: JSON.stringify({
          retry_cadence_days: retryCadenceDays,
          channels,
          max_retries: maxRetries,
          grace_period_days: gracePeriodDays,
          lock_on_failure: dunningLockOnFailure,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const manageBillingLock = async (billingAction: "start_grace" | "lock" | "unlock") => {
    await action("Billing lock control update", async () => {
      const payload: Record<string, unknown> = {
        action: billingAction,
        reason: billingLockReason.trim(),
      };
      if (billingAction !== "unlock") {
        const graceDays = Math.floor(Number(billingLockGraceDays || "7"));
        if (!Number.isFinite(graceDays) || graceDays <= 0) {
          throw new Error("Grace period days must be a positive number.");
        }
        payload.grace_period_days = graceDays;
      }

      const res = await apiClient(`/admin/platform/tenants/${id}/billing-lock`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
    });
  };

  const manageBillingFreeze = async (freezeAction: "start" | "stop") => {
    await action("Billing freeze update", async () => {
      const reason = billingFreezeReason.trim();
      if (!reason) {
        throw new Error("Freeze reason is required.");
      }

      const payload: Record<string, unknown> = {
        action: freezeAction,
        reason,
      };
      if (billingFreezeIncidentId.trim()) payload.incident_id = billingFreezeIncidentId.trim();
      if (freezeAction === "start" && billingFreezeEndsAt.trim()) {
        payload.ends_at = new Date(billingFreezeEndsAt).toISOString();
      }

      const res = await apiClient(`/admin/platform/tenants/${id}/billing-freeze`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setBillingFreezeReason("");
      setBillingFreezeEndsAt("");
      setBillingFreezeIncidentId("");
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

  const requestTenantExport = async () => {
    await action("Tenant data export request", async () => {
      if (!exportReason.trim()) {
        throw new Error("Export reason is required.");
      }

      const includeTables = exportIncludeTables
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      const excludeTables = exportExcludeTables
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      const res = await apiClient(`/admin/platform/tenants/${id}/exports`, {
        method: "POST",
        body: JSON.stringify({
          reason: exportReason.trim(),
          include_users: exportIncludeUsers,
          include_tables: includeTables,
          exclude_tables: excludeTables,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setExportReason("");
      setExportIncludeTables("");
      setExportExcludeTables("");
    });
  };

  const downloadTenantExport = async (exportId: string) => {
    setBusyExportId(exportId);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/tenants/${id}/exports/${exportId}/download`);
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename = match?.[1] || `tenant_export_${id}_${exportId}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage("Export download started.");
      await loadData();
    } catch (e: any) {
      setError(e?.message || "Failed to download export.");
    } finally {
      setBusyExportId("");
    }
  };

  const requestTenantDeletion = async () => {
    await action("Tenant deletion request", async () => {
      if (!deletionReason.trim()) {
        throw new Error("Deletion reason is required.");
      }

      const cooldown = Math.floor(Number(deletionCooldownHours || "24"));
      if (!Number.isFinite(cooldown) || cooldown <= 0) {
        throw new Error("Cooldown hours must be a positive number.");
      }

      const res = await apiClient(`/admin/platform/tenants/${id}/deletion-requests`, {
        method: "POST",
        body: JSON.stringify({
          reason: deletionReason.trim(),
          cooldown_hours: cooldown,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setDeletionReason("");
      setDeletionCooldownHours("24");
    });
  };

  const reviewTenantDeletion = async (requestId: string, decision: "approve" | "reject") => {
    setBusyDeletionRequestId(requestId);
    try {
      await action(`Tenant deletion ${decision}`, async () => {
        const notes = (deletionReviewNotes[requestId] || "").trim();
        const res = await apiClient(`/admin/platform/tenants/${id}/deletion-requests/${requestId}/review`, {
          method: "POST",
          body: JSON.stringify({ decision, notes }),
        });
        if (!res.ok) throw new Error(await res.text());

        setDeletionReviewNotes((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
      });
    } finally {
      setBusyDeletionRequestId("");
    }
  };

  const executeTenantDeletion = async (requestId: string) => {
    setBusyDeletionRequestId(requestId);
    try {
      await action("Tenant deletion execute", async () => {
        const confirmation = deletionConfirmation.trim();
        if (!confirmation) {
          throw new Error(`Confirmation is required: DELETE ${id}`);
        }

        const res = await apiClient(`/admin/platform/tenants/${id}/deletion-requests/${requestId}/execute`, {
          method: "POST",
          body: JSON.stringify({ confirmation }),
        });
        if (!res.ok) throw new Error(await res.text());
        setDeletionConfirmation("");
      });
    } finally {
      setBusyDeletionRequestId("");
    }
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Plan & Billing</span></TabsTrigger>
          <TabsTrigger value="branches" className="gap-2"><GitBranch className="h-4 w-4" /><span className="hidden sm:inline">Branches</span></TabsTrigger>
          <TabsTrigger value="dataops" className="gap-2"><Database className="h-4 w-4" /><span className="hidden sm:inline">Data Ops</span></TabsTrigger>
        </TabsList>

      <TabsContent value="overview" className="space-y-6">

      {/* Tenant Defaults */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground">Tenant Defaults</h2>
        <p className="mt-1 text-sm text-muted-foreground">Core configuration for this tenant&apos;s environment.</p>
        <form onSubmit={submitDefaults} className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Timezone</Label>
            <Input placeholder="e.g. Asia/Kolkata" value={defaults.timezone} onChange={(e) => setDefaults((p) => ({ ...p, timezone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Locale</Label>
            <Input placeholder="e.g. en-IN" value={defaults.locale} onChange={(e) => setDefaults((p) => ({ ...p, locale: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Academic Year</Label>
            <Input placeholder="e.g. 2025-26" value={defaults.academic_year} onChange={(e) => setDefaults((p) => ({ ...p, academic_year: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Region</Label>
            <Input placeholder="e.g. ap-south-1" value={defaults.region} onChange={(e) => setDefaults((p) => ({ ...p, region: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button disabled={busy} type="submit">Save Defaults</Button>
          </div>
        </form>
      </div>

      {/* ── WHITE LABELING ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">White Labeling & Custom Domain</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure branding, set up a custom domain, and provision SSL for this tenant.
          </p>
        </div>

        {/* Step 1: Branding */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">1</div>
            <div>
              <h3 className="font-semibold text-foreground">Brand Identity</h3>
              <p className="text-xs text-muted-foreground">Replace SchoolERP branding with the tenant&apos;s own brand.</p>
            </div>
          </div>
          <form onSubmit={submitBranding} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="white-label-toggle"
                checked={branding.white_label}
                onChange={(e) => setBranding((p) => ({ ...p, white_label: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="white-label-toggle" className="text-sm cursor-pointer">
                Enable white labeling (remove all SchoolERP branding)
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Display Name Override</Label>
              <Input
                placeholder="e.g. Greenwood Academy Portal"
                value={branding.name_override}
                onChange={(e) => setBranding((p) => ({ ...p, name_override: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Primary Brand Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding((p) => ({ ...p, primary_color: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                />
                <Input
                  placeholder="#4f46e5"
                  value={branding.primary_color}
                  onChange={(e) => setBranding((p) => ({ ...p, primary_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Logo URL</Label>
              <Input
                placeholder="https://cdn.example.com/logo.png"
                value={branding.logo_url}
                onChange={(e) => setBranding((p) => ({ ...p, logo_url: e.target.value }))}
              />
              {branding.logo_url && (
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <img src={branding.logo_url} alt="Logo preview" className="h-10 w-auto max-w-[200px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-xs text-muted-foreground">Logo preview</span>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Button disabled={busy} type="submit">Save Branding</Button>
            </div>
          </form>
        </div>

        {/* Step 2: Custom Domain */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">2</div>
            <div>
              <h3 className="font-semibold text-foreground">Custom Domain</h3>
              <p className="text-xs text-muted-foreground">Point a custom domain to this tenant&apos;s instance.</p>
            </div>
          </div>
          <form onSubmit={submitDomainMapping} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Custom Domain</Label>
                <Input
                  placeholder="e.g. erp.greenwoodacademy.edu"
                  value={domainMap.domain}
                  onChange={(e) => setDomainMap((p) => ({ ...p, domain: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">CNAME Target</Label>
                <Input
                  placeholder="Auto-generated on save"
                  value={domainMap.cname_target || `${tenant?.subdomain || "tenant"}.app.schoolerp.com`}
                  onChange={(e) => setDomainMap((p) => ({ ...p, cname_target: e.target.value }))}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* DNS Records Table */}
            {domainMap.domain && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="text-sm font-bold text-foreground mb-3">📋 Required DNS Records</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  The tenant must add these records in their DNS provider before the domain will work:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left text-xs font-bold text-muted-foreground">Type</th>
                        <th className="pb-2 text-left text-xs font-bold text-muted-foreground">Name / Host</th>
                        <th className="pb-2 text-left text-xs font-bold text-muted-foreground">Value / Target</th>
                        <th className="pb-2 text-left text-xs font-bold text-muted-foreground">TTL</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      <tr className="border-b border-border/50">
                        <td className="py-2.5"><Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">CNAME</Badge></td>
                        <td className="py-2.5 text-foreground">{domainMap.domain}</td>
                        <td className="py-2.5 text-foreground">{domainMap.cname_target || `${tenant?.subdomain || "tenant"}.app.schoolerp.com`}</td>
                        <td className="py-2.5 text-muted-foreground">3600</td>
                      </tr>
                      <tr>
                        <td className="py-2.5"><Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">TXT</Badge></td>
                        <td className="py-2.5 text-foreground">_schoolerp-verify.{domainMap.domain}</td>
                        <td className="py-2.5 text-foreground">schoolerp-tenant-{id}</td>
                        <td className="py-2.5 text-muted-foreground">3600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => {
                    navigator.clipboard.writeText(`CNAME ${domainMap.domain} → ${domainMap.cname_target || `${tenant?.subdomain}.app.schoolerp.com`}\nTXT _schoolerp-verify.${domainMap.domain} → schoolerp-tenant-${id}`);
                  }}>
                    Copy DNS Records
                  </Button>
                </div>
              </div>
            )}

            <Button disabled={busy} type="submit">Save Domain Mapping</Button>
          </form>
        </div>

        {/* Step 3: SSL Certificate */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">3</div>
            <div>
              <h3 className="font-semibold text-foreground">SSL Certificate</h3>
              <p className="text-xs text-muted-foreground">Provision and manage HTTPS for the custom domain.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Current Status:</span>
              {(!domainMap.ssl_status || domainMap.ssl_status === "pending") && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">⏳ Pending</Badge>
              )}
              {domainMap.ssl_status === "provisioning" && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">🔄 Provisioning</Badge>
              )}
              {domainMap.ssl_status === "active" && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">✅ Active</Badge>
              )}
              {domainMap.ssl_status === "failed" && (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">❌ Failed</Badge>
              )}
            </div>
          </div>

          {!domainMap.domain ? (
            <div className="rounded-lg border-2 border-dashed border-muted p-6 text-center">
              <p className="text-sm text-muted-foreground">Set up a custom domain first (Step 2) before provisioning SSL.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
                <p><strong className="text-foreground">How it works:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Configure DNS records from Step 2 in the tenant&apos;s domain registrar</li>
                  <li>Click &ldquo;Verify DNS&rdquo; to confirm records are propagated</li>
                  <li>Click &ldquo;Provision SSL&rdquo; to generate a certificate via Let&apos;s Encrypt</li>
                  <li>Certificate auto-renews every 60 days</li>
                </ol>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDomainMap((p) => ({ ...p, ssl_status: "provisioning" }));
                    submitDomainMapping(new Event("submit") as any);
                  }}
                >
                  Verify DNS
                </Button>
                <Button
                  size="sm"
                  type="button"
                  disabled={busy || domainMap.ssl_status === "active"}
                  onClick={() => {
                    setDomainMap((p) => ({ ...p, ssl_status: "provisioning" }));
                    submitDomainMapping(new Event("submit") as any);
                  }}
                >
                  Provision SSL
                </Button>
                {domainMap.ssl_status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setDomainMap((p) => ({ ...p, ssl_status: "provisioning" }));
                      submitDomainMapping(new Event("submit") as any);
                    }}
                  >
                    Force Renew
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </TabsContent>

      <TabsContent value="billing" className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">Plan Assignment</h2>
          <form onSubmit={submitPlan} className="mt-3 space-y-4">
            <div className="space-y-2">
                <Label>Plan Code</Label>
                <PlanSelect 
                    value={planCode} 
                    onSelect={setPlanCode} 
                    placeholder="Select plan..." 
                />
            </div>
            <div className="space-y-2">
                <Label>Modules JSON</Label>
                <Textarea
                  rows={3}
                  className="font-mono text-xs"
                  placeholder='Modules override JSON, e.g. {"attendance":true}'
                  value={planModulesText}
                  onChange={(e) => setPlanModulesText(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label>Limits JSON</Label>
                <Textarea
                  rows={3}
                  className="font-mono text-xs"
                  placeholder='Limits override JSON, e.g. {"students":1200}'
                  value={planLimitsText}
                  onChange={(e) => setPlanLimitsText(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label>Feature Flags JSON</Label>
                <Textarea
                  rows={3}
                  className="font-mono text-xs"
                  placeholder='Feature flags override JSON, e.g. {"beta_transport":true}'
                  value={planFlagsText}
                  onChange={(e) => setPlanFlagsText(e.target.value)}
                />
            </div>
            <Button disabled={busy}>
              Assign Plan & Overrides
            </Button>

            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
              <div>
                  <h3 className="text-sm font-medium text-foreground">Upgrade / Downgrade Plan</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Apply plan change policy with immediate, next-cycle, no-proration, or prorated behavior.
                  </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-2">
                    <Label>Proration Policy</Label>
                    <Select value={prorationPolicy} onValueChange={setProrationPolicy}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prorated">Prorated</SelectItem>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="next_cycle">Next Cycle</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Effective Date</Label>
                    <Input
                      type="datetime-local"
                      value={planEffectiveAt}
                      onChange={(e) => setPlanEffectiveAt(e.target.value)}
                    />
                </div>
                <Button
                  type="button"
                  disabled={busy || !planCode.trim()}
                  onClick={applyPlanChange}
                  variant="secondary"
                  className="w-full"
                >
                  Apply Plan Change
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
              <div>
                  <h3 className="text-sm font-medium text-foreground">Tenant Limit Override</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Limit overrides require a reason for audit logging. Leave expiry empty for permanent overrides.
                  </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
                <div className="space-y-2">
                    <Label>Limit Key</Label>
                    <Select value={limitOverrideKey} onValueChange={setLimitOverrideKey}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="students">Students</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="storage_mb">Storage (MB)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Limit value"
                      value={limitOverrideValue}
                      onChange={(e) => setLimitOverrideValue(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Expires At</Label>
                    <Input
                      type="datetime-local"
                      value={limitOverrideExpiresAt}
                      onChange={(e) => setLimitOverrideExpiresAt(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Incident ID</Label>
                    <Input
                      placeholder="Optional"
                      value={limitOverrideIncidentId}
                      onChange={(e) => setLimitOverrideIncidentId(e.target.value)}
                    />
                </div>
                <Button
                  type="button"
                  disabled={busy || !limitOverrideValue.trim() || !limitOverrideReason.trim()}
                  onClick={applyLimitOverride}
                  variant="secondary"
                  className="w-full"
                >
                  Apply Override
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  className="min-h-[72px]"
                  placeholder="Reason (required)"
                  value={limitOverrideReason}
                  onChange={(e) => setLimitOverrideReason(e.target.value)}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">Security Actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Reset the tenant admin password or force-logout all users.</p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">New Admin Password</Label>
              <Input type="password" placeholder="Enter new password (min. 8 characters)" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetAdminPassword} disabled={busy || !newAdminPassword || newAdminPassword.length < 8}>Reset Admin Password</Button>
              <Button variant="destructive" onClick={forceLogoutUsers} disabled={busy}>Force Logout All Users</Button>
            </div>
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
        <h2 className="font-semibold text-foreground">Dunning & Non-Payment Controls</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure retry cadence/channels and control grace-period lockout behavior for unpaid subscriptions.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <div className="rounded border border-border bg-background/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Subscription</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{billingControls?.subscription_status || "unknown"}</p>
          </div>
          <div className="rounded border border-border bg-background/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Billing Access</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{billingControls?.billing_locked ? "Locked" : "Unlocked"}</p>
          </div>
          <div className="rounded border border-border bg-background/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Grace Ends</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {billingControls?.grace_period_ends_at
                ? new Date(billingControls.grace_period_ends_at).toLocaleString()
                : "-"}
            </p>
          </div>
          <div className="rounded border border-border bg-background/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lock Reason</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{billingControls?.lock_reason || "-"}</p>
          </div>
          <div className="rounded border border-border bg-background/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Billing Freeze</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{billingControls?.billing_frozen ? "Frozen" : "Active"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {billingControls?.freeze_ends_at
                ? `Ends: ${new Date(billingControls.freeze_ends_at).toLocaleString()}`
                : billingControls?.freeze_reason
                  ? `Reason: ${billingControls.freeze_reason}`
                  : "-"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Retry cadence days (e.g. 3,7,14)"
            value={dunningRetryCadence}
            onChange={(e) => setDunningRetryCadence(e.target.value)}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Channels (email,sms,whatsapp)"
            value={dunningChannels}
            onChange={(e) => setDunningChannels(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Max retries"
            value={dunningMaxRetries}
            onChange={(e) => setDunningMaxRetries(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Grace days"
            value={dunningGraceDays}
            onChange={(e) => setDunningGraceDays(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={saveDunningRules}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Save Dunning Rules
          </button>
          <label className="md:col-span-5 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={dunningLockOnFailure}
              onChange={(e) => setDunningLockOnFailure(e.target.checked)}
            />
            Lock tenant access when max retries are exhausted
          </label>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
            placeholder="Lock/Grace reason"
            value={billingLockReason}
            onChange={(e) => setBillingLockReason(e.target.value)}
          />
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Grace days"
            value={billingLockGraceDays}
            onChange={(e) => setBillingLockGraceDays(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => manageBillingLock("start_grace")}
            className="rounded border border-indigo-600/40 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-500/10 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
          >
            Start Grace
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => manageBillingLock("lock")}
            className="rounded border border-red-600/40 px-3 py-2 text-sm text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
          >
            Lock Tenant Access
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => manageBillingLock("unlock")}
            className="rounded border border-emerald-600/40 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
          >
            Unlock Access
          </button>
        </div>

        <div className="mt-4 rounded border border-border bg-background/40 p-3">
          <h3 className="text-sm font-medium text-foreground">Billing Freeze (During Outage)</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Freeze billing actions for this tenant without locking access. Reason is required for audit logging.
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
              placeholder="Freeze reason (required)"
              value={billingFreezeReason}
              onChange={(e) => setBillingFreezeReason(e.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={billingFreezeEndsAt}
              onChange={(e) => setBillingFreezeEndsAt(e.target.value)}
            />
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-3"
              placeholder="Incident ID (optional)"
              value={billingFreezeIncidentId}
              onChange={(e) => setBillingFreezeIncidentId(e.target.value)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !billingFreezeReason.trim()}
              onClick={() => manageBillingFreeze("start")}
              className="rounded border border-indigo-600/40 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-500/10 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
            >
              Start Freeze
            </button>
            <button
              type="button"
              disabled={busy || !billingFreezeReason.trim()}
              onClick={() => manageBillingFreeze("stop")}
              className="rounded border border-emerald-600/40 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
            >
              Stop Freeze
            </button>
          </div>
        </div>
      </div>
      </TabsContent>

      <TabsContent value="dataops" className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground">Impersonation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Login as this tenant&apos;s admin. A detailed reason is required for audit compliance.
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Reason (min. 10 characters)</Label>
            <Textarea
              className="min-h-[80px]"
              placeholder="e.g. Investigating billing issue reported in ticket #1234"
              value={impersonationReason}
              onChange={(e) => setImpersonationReason(e.target.value)}
            />
            {impersonationReason.length > 0 && impersonationReason.trim().length < 10 && (
              <p className="text-xs text-destructive">Reason must be at least 10 characters for audit compliance.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={impersonateTenantAdmin} disabled={busy || impersonationReason.trim().length < 10}>
              Login As Tenant Admin
            </Button>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              ⚠ Session limited to 30 minutes
            </Badge>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Compliance: Tenant Data Export</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a ZIP export (NDJSON per tenant-scoped table + manifest). This is intended for portability and compliance requests.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={busy || loading}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Refresh Exports
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-6">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
            placeholder="Reason (required)"
            value={exportReason}
            onChange={(e) => setExportReason(e.target.value)}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
            placeholder="Include tables (comma-separated, optional)"
            value={exportIncludeTables}
            onChange={(e) => setExportIncludeTables(e.target.value)}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
            placeholder="Exclude tables (comma-separated, optional)"
            value={exportExcludeTables}
            onChange={(e) => setExportExcludeTables(e.target.value)}
          />
          <label className="md:col-span-6 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={exportIncludeUsers}
              onChange={(e) => setExportIncludeUsers(e.target.checked)}
            />
            Include tenant users list (safe projection, no credentials)
          </label>
          <div className="md:col-span-6">
            <button
              type="button"
              onClick={requestTenantExport}
              disabled={busy || !exportReason.trim()}
              className="rounded border border-indigo-600/40 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-500/10 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
            >
              Request Export
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Created</th>
                <th className="py-2">Status</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Requested By</th>
                <th className="py-2">Rows</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {exports.length === 0 ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={6}>
                    No export requests yet.
                  </td>
                </tr>
              ) : (
                exports.map((ex) => (
                  <tr key={ex.id} className="border-t border-border">
                    <td className="py-2 text-muted-foreground">
                      {ex.created_at ? new Date(ex.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="py-2 text-muted-foreground">{ex.status}</td>
                    <td className="py-2 text-muted-foreground">{ex.payload?.reason || "-"}</td>
                    <td className="py-2 text-muted-foreground">
                      <p>{ex.requested_by_name || "-"}</p>
                      <p className="text-xs">{ex.requested_by_email || ex.requested_by || "-"}</p>
                    </td>
                    <td className="py-2 text-muted-foreground">{ex.payload?.total_rows ?? "-"}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => void downloadTenantExport(ex.id)}
                        disabled={busy || busyExportId === ex.id}
                        className="rounded border border-input px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                      >
                        Download
                      </button>
                      {ex.payload?.error && (
                        <p className="mt-1 text-xs text-red-700 dark:text-red-200">{ex.payload.error}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-red-600/40 bg-card p-4 dark:border-red-700/50">
        <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Danger Zone: Tenant Deletion (Soft Close)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Two-person approval required. Execute will set the tenant lifecycle to <span className="font-medium">closed</span> (access disabled) and is logged in the platform audit trail.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Confirmation required: <span className="font-mono">DELETE {id}</span>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-6">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-3"
            placeholder="Reason (required)"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
          />
          <input
            type="number"
            min={1}
            max={168}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-1"
            placeholder="Cooldown"
            value={deletionCooldownHours}
            onChange={(e) => setDeletionCooldownHours(e.target.value)}
          />
          <button
            type="button"
            onClick={requestTenantDeletion}
            disabled={busy || !deletionReason.trim()}
            className="rounded border border-red-600/40 px-3 py-2 text-sm text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20 md:col-span-2"
          >
            Request Deletion
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-6">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-3"
            placeholder={`Type confirmation: DELETE ${id}`}
            value={deletionConfirmation}
            onChange={(e) => setDeletionConfirmation(e.target.value)}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Created</th>
                <th className="py-2">Status</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Requested By</th>
                <th className="py-2">Approved By</th>
                <th className="py-2">Execute After</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {deletionRequests.length === 0 ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={7}>
                    No deletion requests yet.
                  </td>
                </tr>
              ) : (
                deletionRequests.map((req) => (
                  <tr key={req.id} className="border-t border-border">
                    <td className="py-2 text-muted-foreground">
                      {req.created_at ? new Date(req.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="py-2 text-muted-foreground">{req.status}</td>
                    <td className="py-2 text-muted-foreground">
                      <p>{req.payload?.reason || "-"}</p>
                      {req.payload?.notes && <p className="mt-1 text-xs">Notes: {req.payload.notes}</p>}
                      {req.payload?.executed_at && (
                        <p className="mt-1 text-xs">
                          Executed: {new Date(req.payload.executed_at).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      <p>{req.requested_by_name || "-"}</p>
                      <p className="text-xs">{req.requested_by_email || req.requested_by || "-"}</p>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      <p>{req.approved_by_name || "-"}</p>
                      <p className="text-xs">{req.approved_by_email || req.approved_by || "-"}</p>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {req.execute_after ? new Date(req.execute_after).toLocaleString() : "-"}
                    </td>
                    <td className="py-2">
                      {req.status === "pending" ? (
                        <div className="flex flex-col gap-2">
                          <input
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                            placeholder="Review notes (optional)"
                            value={deletionReviewNotes[req.id] || ""}
                            onChange={(e) =>
                              setDeletionReviewNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void reviewTenantDeletion(req.id, "approve")}
                              disabled={busy || busyDeletionRequestId === req.id}
                              className="rounded border border-emerald-600/40 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => void reviewTenantDeletion(req.id, "reject")}
                              disabled={busy || busyDeletionRequestId === req.id}
                              className="rounded border border-red-600/40 px-3 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : req.status === "approved" ? (
                        <button
                          type="button"
                          onClick={() => void executeTenantDeletion(req.id)}
                          disabled={busy || busyDeletionRequestId === req.id || !deletionConfirmation.trim()}
                          className="rounded border border-red-600/40 px-3 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                        >
                          Execute
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </TabsContent>

      <TabsContent value="branches" className="space-y-6">
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
      </TabsContent>
      </Tabs>
    </div>
  );
}
