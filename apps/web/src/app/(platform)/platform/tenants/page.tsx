"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type PlatformTenant = {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  is_active: boolean;
  created_at: string;
  lifecycle_status: string;
  plan_code?: string;
  region?: string;
  branch_count: number;
  student_count: number;
  employee_count: number;
  total_collections: number;
};

type TenantFilters = {
  search: string;
  plan_code: string;
  status: string;
  region: string;
  created_from: string;
  created_to: string;
  include_inactive: boolean;
  sort: string;
  order: string;
  limit: number;
  offset: number;
};

const initialFilters: TenantFilters = {
  search: "",
  plan_code: "",
  status: "",
  region: "",
  created_from: "",
  created_to: "",
  include_inactive: true,
  sort: "created_at",
  order: "desc",
  limit: 50,
  offset: 0,
};

export default function PlatformTenantsPage() {
  const [filters, setFilters] = useState<TenantFilters>(initialFilters);
  const [rows, setRows] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTenantId, setBusyTenantId] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.plan_code) params.set("plan_code", filters.plan_code);
    if (filters.status) params.set("status", filters.status);
    if (filters.region) params.set("region", filters.region);
    if (filters.created_from) params.set("created_from", filters.created_from);
    if (filters.created_to) params.set("created_to", filters.created_to);
    if (filters.include_inactive) params.set("include_inactive", "true");
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.order) params.set("order", filters.order);
    params.set("limit", String(filters.limit));
    params.set("offset", String(filters.offset));
    return params.toString();
  }, [filters]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/admin/platform/tenants${query ? `?${query}` : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateLifecycle = async (tenantId: string, status: string) => {
    setBusyTenantId(tenantId);
    try {
      const res = await apiClient(`/admin/platform/tenants/${tenantId}/lifecycle`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadTenants();
      }
    } finally {
      setBusyTenantId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Tenant Management</h1>
        <p className="text-slate-400">Search, filter, and manage school organizations on the platform.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-6">
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Search tenant/subdomain"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, offset: 0 }))}
        />
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Plan code (e.g. pro)"
          value={filters.plan_code}
          onChange={(e) => setFilters((prev) => ({ ...prev, plan_code: e.target.value, offset: 0 }))}
        />
        <select
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, offset: 0 }))}
        >
          <option value="">All statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="closed">Closed</option>
        </select>
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Region"
          value={filters.region}
          onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value, offset: 0 }))}
        />
        <input
          type="date"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={filters.created_from}
          onChange={(e) => setFilters((prev) => ({ ...prev, created_from: e.target.value, offset: 0 }))}
          title="Created from"
        />
        <input
          type="date"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={filters.created_to}
          onChange={(e) => setFilters((prev) => ({ ...prev, created_to: e.target.value, offset: 0 }))}
          title="Created to"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={filters.include_inactive}
            onChange={(e) => setFilters((prev) => ({ ...prev, include_inactive: e.target.checked, offset: 0 }))}
          />
          Include inactive
        </label>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value, offset: 0 }))}
            title="Sort"
          >
            <option value="created_at">Sort: Created</option>
            <option value="name">Sort: Name</option>
            <option value="subdomain">Sort: Subdomain</option>
          </select>
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={filters.order}
            onChange={(e) => setFilters((prev) => ({ ...prev, order: e.target.value, offset: 0 }))}
            title="Order"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={filters.limit}
            onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value) || 50, offset: 0 }))}
            title="Page size"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <button
            className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
            onClick={() => setFilters(initialFilters)}
            disabled={loading}
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span>
            Showing {rows.length === 0 ? 0 : filters.offset + 1}-{filters.offset + rows.length}
          </span>
          <button
            className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-50"
            onClick={() => setFilters((p) => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
            disabled={loading || filters.offset <= 0}
          >
            Prev
          </button>
          <button
            className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-50"
            onClick={() => setFilters((p) => ({ ...p, offset: p.offset + p.limit }))}
            disabled={loading || rows.length < filters.limit}
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Lifecycle</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={7}>
                  Loading tenants...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={7}>
                  No tenants found.
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">
                      {t.subdomain}
                      {t.domain ? ` • ${t.domain}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{t.plan_code || "-"}</td>
                  <td className="px-4 py-3 text-slate-300">{t.lifecycle_status || "-"}</td>
                  <td className="px-4 py-3 text-slate-300">{t.region || "-"}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {t.student_count} students • {t.employee_count} staff • {t.branch_count} branches
                  </td>
                  <td className="px-4 py-3 text-slate-300">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/platform/tenants/${t.id}`}
                        className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => updateLifecycle(t.id, "active")}
                        disabled={busyTenantId === t.id}
                        className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-900/20 disabled:opacity-60"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => updateLifecycle(t.id, "suspended")}
                        disabled={busyTenantId === t.id}
                        className="rounded border border-amber-700 px-2 py-1 text-xs text-amber-200 hover:bg-amber-900/20 disabled:opacity-60"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => updateLifecycle(t.id, "closed")}
                        disabled={busyTenantId === t.id}
                        className="rounded border border-red-700 px-2 py-1 text-xs text-red-200 hover:bg-red-900/20 disabled:opacity-60"
                      >
                        Close
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
  );
}
