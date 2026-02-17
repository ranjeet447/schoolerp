"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type PlatformPayment = {
  id: string;
  tenant_name: string;
  receipt_number: string;
  amount_paid: number;
  payment_mode: string;
  status: string;
  created_at: string;
};

type RevenueTrendPoint = {
  month: string;
  collections: number;
  receipts_count: number;
};

type PlanMixPoint = {
  plan_code: string;
  count: number;
};

type BillingOverview = {
  mrr: number;
  arr: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  suspended_subscriptions: number;
  closed_subscriptions: number;
  trials_expiring_in_7_days: number;
  renewals_due_in_30_days: number;
  monthly_closed_this_month: number;
  churn_rate_percent: number;
  revenue_trend: RevenueTrendPoint[];
  plan_mix: PlanMixPoint[];
  generated_at: string;
};

export default function PlatformPaymentsPage() {
  const [rows, setRows] = useState<PlatformPayment[]>([]);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [paymentsRes, overviewRes] = await Promise.all([
          apiClient("/admin/platform/payments?limit=200"),
          apiClient("/admin/platform/billing/overview"),
        ]);

        if (paymentsRes.ok) {
          const payments = await paymentsRes.json();
          setRows(Array.isArray(payments) ? payments : []);
        }
        if (overviewRes.ok) {
          const summary = await overviewRes.json();
          setOverview(summary);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
        <p className="text-muted-foreground">Platform subscription health, collections, and payment activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">MRR</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{overview?.mrr ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">ARR</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{overview?.arr ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Active / Trial</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {(overview?.active_subscriptions ?? 0)} / {(overview?.trial_subscriptions ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Churn (Month)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{(overview?.churn_rate_percent ?? 0).toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Revenue Trend (Last 6 Months)</h2>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Collections</th>
                <th className="px-4 py-3">Receipts</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.revenue_trend ?? []).map((point) => (
                <tr key={point.month} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{point.month}</td>
                  <td className="px-4 py-3 text-muted-foreground">{point.collections}</td>
                  <td className="px-4 py-3 text-muted-foreground">{point.receipts_count}</td>
                </tr>
              ))}
              {(overview?.revenue_trend?.length ?? 0) === 0 && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={3}>
                    No trend data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Plan Mix</h2>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Tenants</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.plan_mix ?? []).map((point) => (
                <tr key={point.plan_code} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{point.plan_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{point.count}</td>
                </tr>
              ))}
              {(overview?.plan_mix?.length ?? 0) === 0 && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={2}>
                    No plan mix data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Loading payments...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  No platform payments found.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{p.tenant_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.receipt_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.amount_paid}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.payment_mode}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
