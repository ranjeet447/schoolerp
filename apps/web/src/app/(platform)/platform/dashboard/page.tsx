"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type PlatformSummary = {
  total_tenants: number;
  active_tenants: number;
  total_branches: number;
  total_students: number;
  total_employees: number;
  total_receipts: number;
  total_collections: number;
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function PlatformDashboardPage() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient("/admin/platform/summary");
        if (!res.ok) return;
        const data = await res.json();
        setSummary(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <div className="text-slate-400">Loading platform dashboard...</div>;
  }

  if (!summary) {
    return <div className="text-red-400">Unable to load platform summary.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Dashboard</h1>
        <p className="text-slate-400">Global SaaS visibility across all schools and branches.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Tenants" value={summary.total_tenants} />
        <StatCard label="Active Tenants" value={summary.active_tenants} />
        <StatCard label="Total Branches" value={summary.total_branches} />
        <StatCard label="Total Students" value={summary.total_students} />
        <StatCard label="Total Staff" value={summary.total_employees} />
        <StatCard label="Total Receipts" value={summary.total_receipts} />
        <StatCard label="Total Collections" value={summary.total_collections} />
      </div>
    </div>
  );
}
