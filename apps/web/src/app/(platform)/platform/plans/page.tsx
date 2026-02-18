"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@schoolerp/ui";
import { PackageOpen, Flag } from "lucide-react";

type PlatformPlan = {
  id: string;
  code: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  modules: Record<string, unknown>;
  limits: Record<string, unknown>;
  feature_flags: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PlanEditorState = {
  id?: string;
  code: string;
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  modules_text: string;
  limits_text: string;
  feature_flags_text: string;
  is_active: boolean;
};

type FeatureRolloutForm = {
  flag_key: string;
  enabled: boolean;
  percentage: string;
  plan_code: string;
  region: string;
  status: string;
  tenant_ids_csv: string;
  dry_run: boolean;
};

const EMPTY_PLAN_EDITOR: PlanEditorState = {
  code: "",
  name: "",
  description: "",
  price_monthly: "0",
  price_yearly: "0",
  modules_text: "{}",
  limits_text: "{}",
  feature_flags_text: "{}",
  is_active: true,
};

const EMPTY_ROLLOUT_FORM: FeatureRolloutForm = {
  flag_key: "",
  enabled: true,
  percentage: "50",
  plan_code: "",
  region: "",
  status: "",
  tenant_ids_csv: "",
  dry_run: true,
};

function toEditorState(plan: PlatformPlan): PlanEditorState {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description || "",
    price_monthly: String(plan.price_monthly ?? 0),
    price_yearly: String(plan.price_yearly ?? 0),
    modules_text: JSON.stringify(plan.modules || {}, null, 2),
    limits_text: JSON.stringify(plan.limits || {}, null, 2),
    feature_flags_text: JSON.stringify(plan.feature_flags || {}, null, 2),
    is_active: plan.is_active,
  };
}

function mustParseJSONObject(raw: string, label: string) {
  try {
    const value = JSON.parse(raw || "{}");
    if (!value || Array.isArray(value) || typeof value !== "object") {
      throw new Error(`${label} must be a JSON object.`);
    }
    return value;
  } catch {
    throw new Error(`${label} must be valid JSON object.`);
  }
}

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState<PlanEditorState>(EMPTY_PLAN_EDITOR);
  const [editForm, setEditForm] = useState<PlanEditorState | null>(null);
  const [rolloutForm, setRolloutForm] = useState<FeatureRolloutForm>(EMPTY_ROLLOUT_FORM);

  const loadPlans = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (includeInactive) params.set("include_inactive", "true");
      const query = params.toString();

      const res = await apiClient(`/admin/platform/plans${query ? `?${query}` : ""}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  const createPlan = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        code: createForm.code,
        name: createForm.name,
        description: createForm.description,
        price_monthly: Number(createForm.price_monthly || 0),
        price_yearly: Number(createForm.price_yearly || 0),
        modules: mustParseJSONObject(createForm.modules_text, "Modules"),
        limits: mustParseJSONObject(createForm.limits_text, "Limits"),
        feature_flags: mustParseJSONObject(createForm.feature_flags_text, "Feature flags"),
        is_active: createForm.is_active,
      };

      const res = await apiClient("/admin/platform/plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setCreateForm(EMPTY_PLAN_EDITOR);
      setMessage("Plan created.");
      await loadPlans();
    } catch (e: any) {
      setError(e?.message || "Failed to create plan.");
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!editForm?.id) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        code: editForm.code,
        name: editForm.name,
        description: editForm.description,
        price_monthly: Number(editForm.price_monthly || 0),
        price_yearly: Number(editForm.price_yearly || 0),
        modules: mustParseJSONObject(editForm.modules_text, "Modules"),
        limits: mustParseJSONObject(editForm.limits_text, "Limits"),
        feature_flags: mustParseJSONObject(editForm.feature_flags_text, "Feature flags"),
        is_active: editForm.is_active,
      };

      const res = await apiClient(`/admin/platform/plans/${editForm.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setMessage("Plan updated.");
      await loadPlans();
    } catch (e: any) {
      setError(e?.message || "Failed to update plan.");
    } finally {
      setSaving(false);
    }
  };

  const clonePlan = async (plan: PlatformPlan) => {
    const cloneCode = window.prompt("Clone code (must be unique):", `${plan.code}-copy`);
    if (!cloneCode) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await apiClient(`/admin/platform/plans/${plan.id}/clone`, {
        method: "POST",
        body: JSON.stringify({
          code: cloneCode.trim(),
          name: `${plan.name} Copy`,
          description: plan.description || "",
          is_active: plan.is_active,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Plan cloned.");
      await loadPlans();
    } catch (e: any) {
      setError(e?.message || "Failed to clone plan.");
    } finally {
      setSaving(false);
    }
  };

  const togglePlanStatus = async (plan: PlatformPlan) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await apiClient(`/admin/platform/plans/${plan.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage(`Plan ${plan.is_active ? "deactivated" : "activated"}.`);
      await loadPlans();
    } catch (e: any) {
      setError(e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const rolloutFeatureFlag = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const tenantIDs = rolloutForm.tenant_ids_csv
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      const payload = {
        flag_key: rolloutForm.flag_key.trim(),
        enabled: rolloutForm.enabled,
        percentage: Number(rolloutForm.percentage || 0),
        plan_code: rolloutForm.plan_code.trim(),
        region: rolloutForm.region.trim(),
        status: rolloutForm.status.trim(),
        tenant_ids: tenantIDs,
        dry_run: rolloutForm.dry_run,
      };

      const res = await apiClient("/admin/platform/feature-rollouts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMessage(
        `Feature rollout ${data.dry_run ? "dry-run" : "applied"}: matched ${data.total_matched}, selected ${data.applied_count}.`
      );
      await loadPlans();
    } catch (e: any) {
      setError(e?.message || "Failed to execute feature rollout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Plans, Modules & Flags</h1>
        <p className="text-muted-foreground">
          Build platform plans, manage module bundles, and control feature rollout defaults.
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

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
          <TabsTrigger value="plans" className="gap-2"><PackageOpen className="h-4 w-4" /><span className="hidden sm:inline">Plans</span></TabsTrigger>
          <TabsTrigger value="rollout" className="gap-2"><Flag className="h-4 w-4" /><span className="hidden sm:inline">Feature Rollout</span></TabsTrigger>
        </TabsList>

      <TabsContent value="plans" className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row">
          <input
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:max-w-md"
            placeholder="Search by plan name/code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void loadPlans()}
            className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            disabled={loading}
          >
            Search
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Include inactive plans
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createPlan} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Create Plan</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Code (basic/pro/enterprise)"
              value={createForm.code}
              onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))}
            />
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Plan name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Monthly price"
              value={createForm.price_monthly}
              onChange={(e) => setCreateForm((p) => ({ ...p, price_monthly: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Yearly price"
              value={createForm.price_yearly}
              onChange={(e) => setCreateForm((p) => ({ ...p, price_yearly: e.target.value }))}
            />
          </div>
          <input
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
          />
          <textarea
            rows={4}
            className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground"
            placeholder='Modules JSON, e.g. {"attendance": true}'
            value={createForm.modules_text}
            onChange={(e) => setCreateForm((p) => ({ ...p, modules_text: e.target.value }))}
          />
          <textarea
            rows={4}
            className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground"
            placeholder='Limits JSON, e.g. {"students": 1000}'
            value={createForm.limits_text}
            onChange={(e) => setCreateForm((p) => ({ ...p, limits_text: e.target.value }))}
          />
          <textarea
            rows={4}
            className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground"
            placeholder='Feature Flags JSON, e.g. {"beta_transport": false}'
            value={createForm.feature_flags_text}
            onChange={(e) => setCreateForm((p) => ({ ...p, feature_flags_text: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={createForm.is_active}
              onChange={(e) => setCreateForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            Active
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Create Plan
          </button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                    Loading plans...
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                    No plans found.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{plan.code}</td>
                    <td className="px-4 py-3 text-foreground">{plan.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {plan.price_monthly} / {plan.price_yearly}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{plan.is_active ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditForm(toEditorState(plan))}
                          className="rounded border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void clonePlan(plan)}
                          disabled={saving}
                          className="rounded border border-indigo-600/40 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-500/10 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
                        >
                          Clone
                        </button>
                        <button
                          type="button"
                          onClick={() => void togglePlanStatus(plan)}
                          disabled={saving}
                          className={`rounded border px-2 py-1 text-xs disabled:opacity-60 ${
                            plan.is_active
                              ? "border-amber-600/40 text-amber-700 hover:bg-amber-500/10 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
                              : "border-emerald-600/40 text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                          }`}
                        >
                          {plan.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editForm && (
        <form onSubmit={updatePlan} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Edit Plan</h2>
            <button
              type="button"
              onClick={() => setEditForm(null)}
              className="rounded border border-input px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              value={editForm.code}
              onChange={(e) => setEditForm((p) => (p ? { ...p, code: e.target.value } : p))}
            />
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => (p ? { ...p, name: e.target.value } : p))}
            />
            <input
              type="number"
              min={0}
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={editForm.price_monthly}
              onChange={(e) => setEditForm((p) => (p ? { ...p, price_monthly: e.target.value } : p))}
            />
            <input
              type="number"
              min={0}
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={editForm.price_yearly}
              onChange={(e) => setEditForm((p) => (p ? { ...p, price_yearly: e.target.value } : p))}
            />
          </div>
          <input
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            value={editForm.description}
            onChange={(e) => setEditForm((p) => (p ? { ...p, description: e.target.value } : p))}
          />
          <textarea
            rows={4}
            className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
            value={editForm.modules_text}
            onChange={(e) => setEditForm((p) => (p ? { ...p, modules_text: e.target.value } : p))}
          />
          <textarea
            rows={4}
            className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
            value={editForm.limits_text}
            onChange={(e) => setEditForm((p) => (p ? { ...p, limits_text: e.target.value } : p))}
          />
          <textarea
            rows={4}
            className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
            value={editForm.feature_flags_text}
            onChange={(e) => setEditForm((p) => (p ? { ...p, feature_flags_text: e.target.value } : p))}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) => setEditForm((p) => (p ? { ...p, is_active: e.target.checked } : p))}
            />
            Active
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Save Changes
          </button>
        </form>
      )}

      </TabsContent>

      <TabsContent value="rollout" className="space-y-6">
      <form onSubmit={rolloutFeatureFlag} className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">Feature Flag Rollout</h2>
        <p className="text-sm text-muted-foreground">
          Roll out a single feature flag by cohort filters and rollout percentage.
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Flag key (e.g. beta_transport)"
            value={rolloutForm.flag_key}
            onChange={(e) => setRolloutForm((p) => ({ ...p, flag_key: e.target.value }))}
          />
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={rolloutForm.enabled ? "enabled" : "disabled"}
            onChange={(e) => setRolloutForm((p) => ({ ...p, enabled: e.target.value === "enabled" }))}
          >
            <option value="enabled">Set Enabled</option>
            <option value="disabled">Set Disabled</option>
          </select>
          <input
            type="number"
            min={1}
            max={100}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Percentage"
            value={rolloutForm.percentage}
            onChange={(e) => setRolloutForm((p) => ({ ...p, percentage: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Filter by plan code (optional)"
            value={rolloutForm.plan_code}
            onChange={(e) => setRolloutForm((p) => ({ ...p, plan_code: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Filter by region (optional)"
            value={rolloutForm.region}
            onChange={(e) => setRolloutForm((p) => ({ ...p, region: e.target.value }))}
          />
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={rolloutForm.status}
            onChange={(e) => setRolloutForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">Any status</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <textarea
          rows={2}
          className="w-full rounded border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
          placeholder="Optional tenant IDs CSV for explicit cohort targeting"
          value={rolloutForm.tenant_ids_csv}
          onChange={(e) => setRolloutForm((p) => ({ ...p, tenant_ids_csv: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={rolloutForm.dry_run}
            onChange={(e) => setRolloutForm((p) => ({ ...p, dry_run: e.target.checked }))}
          />
          Dry run only (no database write)
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          Execute Rollout
        </button>
      </form>
      </TabsContent>
      </Tabs>
    </div>
  );
}
