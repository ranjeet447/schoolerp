"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type PasswordPolicy = {
  min_length: number;
  history_count: number;
  max_age_days: number;
  updated_at?: string | null;
};

const DEFAULT_POLICY: PasswordPolicy = {
  min_length: 8,
  history_count: 0,
  max_age_days: 0,
  updated_at: null,
};

async function readAPIError(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      const message = String(data?.message || data?.error || "").trim();
      if (message) return message;
    } else {
      const text = (await response.text()).trim();
      if (text) return text;
    }
  } catch {
    // ignore parse failures and return fallback below
  }
  return fallback;
}

export default function PlatformPasswordPolicyPage() {
  const [policy, setPolicy] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient("/admin/platform/security/password-policy");
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to load password policy."));
      const data: PasswordPolicy = await res.json();
      setPolicy({
        min_length: Number(data?.min_length ?? 8),
        history_count: Number(data?.history_count ?? 0),
        max_age_days: Number(data?.max_age_days ?? 0),
        updated_at: data?.updated_at ?? null,
      });
      setLastLoadedAt(new Date().toISOString());
    } catch (e: any) {
      setPolicy(DEFAULT_POLICY);
      setError(e?.message || "Failed to load password policy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        min_length: Number(policy.min_length) || 8,
        history_count: Number(policy.history_count) || 0,
        max_age_days: Number(policy.max_age_days) || 0,
      };

      const res = await apiClient("/admin/platform/security/password-policy", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to update password policy."));

      const updated: PasswordPolicy = await res.json();
      setPolicy({
        min_length: Number(updated?.min_length ?? payload.min_length),
        history_count: Number(updated?.history_count ?? payload.history_count),
        max_age_days: Number(updated?.max_age_days ?? payload.max_age_days),
        updated_at: updated?.updated_at ?? null,
      });
      setMessage("Password policy updated.");
    } catch (e: any) {
      setError(e?.message || "Failed to update password policy.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading password policy...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Governance: Password Policy</h1>
        <p className="text-muted-foreground">
          Configure global password policy for password-based identities (min length, reuse history, and expiry).
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          This policy is applied platform-wide during registration, reset, and login enforcement checks.
        </p>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Policy Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes apply to new passwords, resets, and onboarding flows. Expiry is evaluated at login.
            </p>
            {policy.updated_at && (
              <p className="mt-1 text-xs text-muted-foreground">Last updated: {new Date(policy.updated_at).toLocaleString()}</p>
            )}
            {lastLoadedAt && (
              <p className="mt-1 text-xs text-muted-foreground">Last refreshed: {new Date(lastLoadedAt).toLocaleTimeString()}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
            >
              Refresh
            </button>
            <button
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded border border-border bg-background/40 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Min Length</label>
            <input
              type="number"
              min={8}
              max={128}
              value={policy.min_length}
              onChange={(e) => setPolicy((prev) => ({ ...prev, min_length: Number(e.target.value) }))}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            <p className="mt-2 text-xs text-muted-foreground">Recommended: 12+. Range: 8-128.</p>
          </div>

          <div className="rounded border border-border bg-background/40 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">History Count</label>
            <input
              type="number"
              min={0}
              max={20}
              value={policy.history_count}
              onChange={(e) => setPolicy((prev) => ({ ...prev, history_count: Number(e.target.value) }))}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            <p className="mt-2 text-xs text-muted-foreground">0 disables reuse checks. Range: 0-20.</p>
          </div>

          <div className="rounded border border-border bg-background/40 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max Age (Days)</label>
            <input
              type="number"
              min={0}
              max={3650}
              value={policy.max_age_days}
              onChange={(e) => setPolicy((prev) => ({ ...prev, max_age_days: Number(e.target.value) }))}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            <p className="mt-2 text-xs text-muted-foreground">0 disables expiry enforcement. Range: 0-3650.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Operational Notes</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
          <li>Ensure migration 000042 is applied for history/expiry tracking tables and columns.</li>
          <li>When enabling expiry, keep at least two super admins to avoid lockout scenarios.</li>
        </ul>
      </div>
    </div>
  );
}
