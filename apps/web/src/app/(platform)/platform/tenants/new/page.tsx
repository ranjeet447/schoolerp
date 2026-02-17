"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function PlatformCreateTenantPage() {
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    subdomain: "",
    domain: "",
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    password: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTenantId(null);

    try {
      const res = await apiClient("/admin/tenants/onboard", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setTenantId(data.tenant_id || null);
    } catch (err: any) {
      setError(err?.message || "Failed to create tenant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Tenant</h1>
          <p className="text-muted-foreground">Manually onboard a new school/organization and its first admin.</p>
        </div>
        <Link
          href="/platform/tenants"
          className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Back
        </Link>
      </div>

      {tenantId && (
        <div className="rounded-xl border border-emerald-600/40 bg-emerald-500/10 p-4 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="font-semibold">Tenant created</div>
          <div className="mt-1 text-sm">
            Tenant ID: <span className="font-mono">{tenantId}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              href={`/platform/tenants/${tenantId}`}
            >
              Open Tenant
            </Link>
            <button
              type="button"
              className="rounded border border-emerald-600/40 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-500/10 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
              onClick={() => navigator.clipboard.writeText(tenantId)}
            >
              Copy Tenant ID
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="School name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Subdomain (e.g. oakridge)"
          value={form.subdomain}
          onChange={(e) => setForm((p) => ({ ...p, subdomain: e.target.value }))}
          required
        />
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
          placeholder="Custom domain (optional)"
          value={form.domain}
          onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
        />

        <div className="md:col-span-2 border-t border-border pt-4 text-sm font-semibold text-muted-foreground">
          Admin Account
        </div>

        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Admin full name"
          value={form.admin_name}
          onChange={(e) => setForm((p) => ({ ...p, admin_name: e.target.value }))}
          required
        />
        <input
          type="email"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Admin email"
          value={form.admin_email}
          onChange={(e) => setForm((p) => ({ ...p, admin_email: e.target.value }))}
          required
        />
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Admin phone (optional)"
          value={form.admin_phone}
          onChange={(e) => setForm((p) => ({ ...p, admin_phone: e.target.value }))}
        />
        <input
          type="password"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          required
        />

        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Tenant"}
          </button>
        </div>
      </form>
    </div>
  );
}
