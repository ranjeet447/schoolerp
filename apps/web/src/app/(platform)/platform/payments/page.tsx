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

export default function PlatformPaymentsPage() {
  const [rows, setRows] = useState<PlatformPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient("/admin/platform/payments?limit=200");
        if (!res.ok) return;
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Payments</h1>
        <p className="text-slate-400">Cross-tenant receipts and collection activity.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
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
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  Loading payments...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={6}>
                  No platform payments found.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 text-white">{p.tenant_name}</td>
                  <td className="px-4 py-3 text-slate-300">{p.receipt_number}</td>
                  <td className="px-4 py-3 text-slate-300">{p.amount_paid}</td>
                  <td className="px-4 py-3 text-slate-300">{p.payment_mode}</td>
                  <td className="px-4 py-3 text-slate-300">{p.status}</td>
                  <td className="px-4 py-3 text-slate-300">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
