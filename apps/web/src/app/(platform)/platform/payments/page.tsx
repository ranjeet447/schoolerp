"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@schoolerp/ui";
import { BarChart3, FileText, Settings } from "lucide-react";

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

type TenantOption = {
  id: string;
  name: string;
};

type PlatformInvoice = {
  id: string;
  invoice_number: string;
  tenant_id: string;
  tenant_name: string;
  currency: string;
  amount_total: number;
  tax_amount: number;
  status: string;
  due_date?: string;
  issued_at?: string;
  paid_at?: string;
  external_ref?: string;
};

type PlatformInvoiceAdjustment = {
  id: string;
  invoice_id: string;
  invoice_number: string;
  tenant_id: string;
  tenant_name: string;
  adjustment_type: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  external_ref?: string;
  created_at: string;
};

export default function PlatformPaymentsPage() {
  const [rows, setRows] = useState<PlatformPayment[]>([]);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [adjustments, setAdjustments] = useState<PlatformInvoiceAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newInvoice, setNewInvoice] = useState({
    tenant_id: "",
    amount_total: "",
    tax_amount: "0",
    due_date: "",
    currency: "INR",
  });
  const [billingConfigText, setBillingConfigText] = useState({
    gateway_settings: "{}",
    tax_rules: "{}",
    invoice_template: "{}",
  });

  const parseJSONMap = (raw: string, label: string) => {
    try {
      const value = JSON.parse(raw || "{}");
      if (!value || Array.isArray(value) || typeof value !== "object") {
        throw new Error(`${label} must be a JSON object.`);
      }
      return value;
    } catch {
      throw new Error(`${label} must be valid JSON object.`);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [paymentsRes, overviewRes, tenantsRes, invoicesRes, configRes, adjustmentsRes] = await Promise.all([
        apiClient("/admin/platform/payments?limit=200"),
        apiClient("/admin/platform/billing/overview"),
        apiClient("/admin/platform/tenants?limit=200"),
        apiClient("/admin/platform/invoices?limit=200"),
        apiClient("/admin/platform/billing/config"),
        apiClient("/admin/platform/invoice-adjustments?limit=200"),
      ]);

      if (paymentsRes.ok) {
        const payments = await paymentsRes.json();
        setRows(Array.isArray(payments) ? payments : []);
      }
      if (overviewRes.ok) {
        const summary = await overviewRes.json();
        setOverview(summary);
      }
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(
          Array.isArray(tenantsData)
            ? tenantsData.map((t) => ({ id: t.id, name: t.name }))
            : []
        );
      }
      if (invoicesRes.ok) {
        const invoiceData = await invoicesRes.json();
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      }
      if (configRes.ok) {
        const configData = await configRes.json();
        setBillingConfigText({
          gateway_settings: JSON.stringify(configData.gateway_settings || {}, null, 2),
          tax_rules: JSON.stringify(configData.tax_rules || {}, null, 2),
          invoice_template: JSON.stringify(configData.invoice_template || {}, null, 2),
        });
      }
      if (adjustmentsRes.ok) {
        const adjustmentData = await adjustmentsRes.json();
        setAdjustments(Array.isArray(adjustmentData) ? adjustmentData : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createInvoice = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const amount = Number(newInvoice.amount_total);
      const tax = Number(newInvoice.tax_amount || 0);
      if (!newInvoice.tenant_id || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(tax) || tax < 0) {
        throw new Error("Valid tenant, amount, and tax are required.");
      }

      const dueDate = newInvoice.due_date ? new Date(newInvoice.due_date).toISOString() : "";
      const payload = {
        tenant_id: newInvoice.tenant_id,
        currency: newInvoice.currency || "INR",
        amount_total: Math.floor(amount),
        tax_amount: Math.floor(tax),
        due_date: dueDate,
        line_items: [
          {
            code: "subscription",
            description: "Platform subscription invoice",
            amount: Math.floor(amount),
          },
        ],
      };

      const res = await apiClient("/admin/platform/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setMessage("Invoice created.");
      setNewInvoice({
        tenant_id: "",
        amount_total: "",
        tax_amount: "0",
        due_date: "",
        currency: "INR",
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create invoice.");
    } finally {
      setBusy(false);
    }
  };

  const resendInvoice = async (invoiceId: string) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await apiClient(`/admin/platform/invoices/${invoiceId}/resend`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Invoice resend recorded.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to resend invoice.");
    } finally {
      setBusy(false);
    }
  };

  const markInvoicePaid = async (invoiceId: string) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await apiClient(`/admin/platform/invoices/${invoiceId}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({
          payment_mode: "offline",
          reference: `manual-${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Invoice marked paid (offline).");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to mark invoice paid.");
    } finally {
      setBusy(false);
    }
  };

  const exportInvoice = async (invoiceId: string) => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await apiClient(`/admin/platform/invoices/${invoiceId}/export`);
      if (!res.ok) throw new Error(await res.text());
      setMessage("Invoice export generated (JSON response available from API).");
    } catch (e: any) {
      setError(e?.message || "Failed to export invoice.");
    } finally {
      setBusy(false);
    }
  };

  const issueRefund = async (invoice: PlatformInvoice) => {
    const rawAmount = window.prompt(
      `Refund amount for ${invoice.invoice_number}`,
      String(invoice.amount_total + invoice.tax_amount)
    );
    if (!rawAmount) return;
    const amount = Math.floor(Number(rawAmount));
    const reason = window.prompt("Refund reason");
    if (!reason) return;
    const reference = window.prompt("Refund reference (optional)") || "";

    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Refund amount must be a positive number.");
      }
      const res = await apiClient(`/admin/platform/invoices/${invoice.id}/refunds`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          reason,
          external_ref: reference,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Refund recorded.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create refund.");
    } finally {
      setBusy(false);
    }
  };

  const issueCreditNote = async (invoice: PlatformInvoice) => {
    const rawAmount = window.prompt(
      `Credit note amount for ${invoice.invoice_number}`,
      String(invoice.amount_total + invoice.tax_amount)
    );
    if (!rawAmount) return;
    const amount = Math.floor(Number(rawAmount));
    const reason = window.prompt("Credit note reason");
    if (!reason) return;
    const applyImmediately = window.confirm("Apply this credit note immediately to the invoice?");
    const reference = window.prompt("Credit note reference (optional)") || "";

    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Credit note amount must be a positive number.");
      }
      const res = await apiClient(`/admin/platform/invoices/${invoice.id}/credit-notes`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          reason,
          apply_immediately: applyImmediately,
          external_ref: reference,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage("Credit note recorded.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create credit note.");
    } finally {
      setBusy(false);
    }
  };

  const saveBillingConfig = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        gateway_settings: parseJSONMap(billingConfigText.gateway_settings, "Gateway settings"),
        tax_rules: parseJSONMap(billingConfigText.tax_rules, "Tax rules"),
        invoice_template: parseJSONMap(billingConfigText.invoice_template, "Invoice template"),
      };
      const res = await apiClient("/admin/platform/billing/config", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      setMessage("Billing configuration updated.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to save billing configuration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
        <p className="text-muted-foreground">Platform subscription health, collections, and payment activity.</p>
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
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2"><FileText className="h-4 w-4" /><span className="hidden sm:inline">Invoices</span></TabsTrigger>
          <TabsTrigger value="config" className="gap-2"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Configuration</span></TabsTrigger>
        </TabsList>

      <TabsContent value="overview" className="space-y-6">

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
      </TabsContent>

      <TabsContent value="invoices" className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Create Invoice</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={newInvoice.tenant_id}
            onChange={(e) => setNewInvoice((p) => ({ ...p, tenant_id: e.target.value }))}
          >
            <option value="">Select tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Amount total"
            value={newInvoice.amount_total}
            onChange={(e) => setNewInvoice((p) => ({ ...p, amount_total: e.target.value }))}
          />
          <input
            type="number"
            min={0}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Tax amount"
            value={newInvoice.tax_amount}
            onChange={(e) => setNewInvoice((p) => ({ ...p, tax_amount: e.target.value }))}
          />
          <input
            type="datetime-local"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={newInvoice.due_date}
            onChange={(e) => setNewInvoice((p) => ({ ...p, due_date: e.target.value }))}
          />
          <button
            type="button"
            onClick={createInvoice}
            disabled={busy}
            className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Create Invoice
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{invoice.tenant_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{invoice.amount_total}</td>
                  <td className="px-4 py-3 text-muted-foreground">{invoice.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => resendInvoice(invoice.id)}
                        disabled={busy}
                        className="rounded border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        onClick={() => markInvoicePaid(invoice.id)}
                        disabled={busy || invoice.status === "paid"}
                        className="rounded border border-emerald-600/40 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                      >
                        Mark Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => exportInvoice(invoice.id)}
                        disabled={busy}
                        className="rounded border border-indigo-600/40 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-500/10 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
                      >
                        Export
                      </button>
                      <button
                        type="button"
                        onClick={() => issueRefund(invoice)}
                        disabled={busy}
                        className="rounded border border-amber-600/40 px-2 py-1 text-xs text-amber-700 hover:bg-amber-500/10 disabled:opacity-60 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
                      >
                        Refund
                      </button>
                      <button
                        type="button"
                        onClick={() => issueCreditNote(invoice)}
                        disabled={busy}
                        className="rounded border border-sky-600/40 px-2 py-1 text-xs text-sky-700 hover:bg-sky-500/10 disabled:opacity-60 dark:border-sky-700 dark:text-sky-200 dark:hover:bg-sky-900/20"
                      >
                        Credit Note
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Adjustments</h2>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  Loading adjustments...
                </td>
              </tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  No adjustments found.
                </td>
              </tr>
            ) : (
              adjustments.map((adj) => (
                <tr key={adj.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{adj.invoice_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{adj.tenant_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{adj.adjustment_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {adj.amount} {adj.currency}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{adj.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{adj.reason || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(adj.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
      </TabsContent>

      <TabsContent value="config" className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Billing Configuration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage payment gateway, GST/VAT rules, and invoice template configuration.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gateway Settings</p>
            <textarea
              rows={8}
              className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
              value={billingConfigText.gateway_settings}
              onChange={(e) => setBillingConfigText((p) => ({ ...p, gateway_settings: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tax Rules</p>
            <textarea
              rows={8}
              className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
              value={billingConfigText.tax_rules}
              onChange={(e) => setBillingConfigText((p) => ({ ...p, tax_rules: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice Template</p>
            <textarea
              rows={8}
              className="w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs text-foreground"
              value={billingConfigText.invoice_template}
              onChange={(e) => setBillingConfigText((p) => ({ ...p, invoice_template: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={saveBillingConfig}
          disabled={busy}
          className="mt-3 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          Save Billing Config
        </button>
      </div>
      </TabsContent>
      </Tabs>
    </div>
  );
}
