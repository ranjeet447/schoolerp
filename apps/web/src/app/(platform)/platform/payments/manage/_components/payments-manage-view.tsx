"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@schoolerp/ui";
import { BarChart3, FileText, Settings, ArrowRight } from "lucide-react";
import { TenantSelect } from "@/components/ui/tenant-select";

export type PaymentsManageTab = "overview" | "invoices" | "config";

export function isPaymentsManageTab(value: string): value is PaymentsManageTab {
  return value === "overview" || value === "invoices" || value === "config";
}

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
  line_items?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
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

type PlatformBillingConfig = {
  gateway_settings: Record<string, unknown>;
  tax_rules: Record<string, unknown>;
  invoice_template: Record<string, unknown>;
};

type BillingConfigForm = {
  provider: string;
  mode: string;
  merchant_id: string;
  public_key: string;
  webhook_url: string;
  webhook_secret: string;
  auto_collection: boolean;
  tax_enabled: boolean;
  tax_label: string;
  default_tax_rate_percent: string;
  tax_inclusive: boolean;
  invoice_prefix: string;
  payment_terms_days: string;
  late_fee_percent: string;
  support_email: string;
  support_phone: string;
  footer_note: string;
};

const EMPTY_BILLING_CONFIG_FORM: BillingConfigForm = {
  provider: "manual",
  mode: "test",
  merchant_id: "",
  public_key: "",
  webhook_url: "",
  webhook_secret: "",
  auto_collection: false,
  tax_enabled: true,
  tax_label: "GST",
  default_tax_rate_percent: "18",
  tax_inclusive: false,
  invoice_prefix: "INV",
  payment_terms_days: "15",
  late_fee_percent: "0",
  support_email: "",
  support_phone: "",
  footer_note: "Thank you for choosing SchoolERP.",
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

function escapeHtml(raw: unknown): string {
  return String(raw ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function asString(raw: unknown, fallback = ""): string {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return fallback;
}

function asBoolean(raw: unknown, fallback = false): boolean {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  }
  return fallback;
}

function asNumberString(raw: unknown, fallback: string): string {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return String(parsed);
}

function applyBillingConfig(configData: PlatformBillingConfig): {
  source: PlatformBillingConfig;
  form: BillingConfigForm;
} {
  const gateway = configData?.gateway_settings || {};
  const taxRules = configData?.tax_rules || {};
  const template = configData?.invoice_template || {};
  return {
    source: {
      gateway_settings: gateway,
      tax_rules: taxRules,
      invoice_template: template,
    },
    form: {
      provider: asString(gateway.provider, EMPTY_BILLING_CONFIG_FORM.provider),
      mode: asString(gateway.mode, EMPTY_BILLING_CONFIG_FORM.mode),
      merchant_id: asString(gateway.merchant_id, ""),
      public_key: asString(gateway.public_key, ""),
      webhook_url: asString(gateway.webhook_url, ""),
      webhook_secret: asString(gateway.webhook_secret, ""),
      auto_collection: asBoolean(gateway.auto_collection, EMPTY_BILLING_CONFIG_FORM.auto_collection),
      tax_enabled: asBoolean(taxRules.enabled, EMPTY_BILLING_CONFIG_FORM.tax_enabled),
      tax_label: asString(taxRules.label, EMPTY_BILLING_CONFIG_FORM.tax_label),
      default_tax_rate_percent: asNumberString(taxRules.default_rate_percent, EMPTY_BILLING_CONFIG_FORM.default_tax_rate_percent),
      tax_inclusive: asBoolean(taxRules.inclusive, EMPTY_BILLING_CONFIG_FORM.tax_inclusive),
      invoice_prefix: asString(template.invoice_prefix, EMPTY_BILLING_CONFIG_FORM.invoice_prefix),
      payment_terms_days: asNumberString(template.payment_terms_days, EMPTY_BILLING_CONFIG_FORM.payment_terms_days),
      late_fee_percent: asNumberString(template.late_fee_percent, EMPTY_BILLING_CONFIG_FORM.late_fee_percent),
      support_email: asString(template.support_email, ""),
      support_phone: asString(template.support_phone, ""),
      footer_note: asString(template.footer_note, EMPTY_BILLING_CONFIG_FORM.footer_note),
    },
  };
}

export function PaymentsManageView({ activeTab }: { activeTab: PaymentsManageTab }) {
  const router = useRouter();
  const [rows, setRows] = useState<PlatformPayment[]>([]);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [adjustments, setAdjustments] = useState<PlatformInvoiceAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newInvoice, setNewInvoice] = useState({
    tenant_id: "",
    currency: "INR",
    item_code: "subscription",
    item_description: "Platform subscription charge",
    quantity: "1",
    unit_price: "",
    tax_rate_percent: "18",
    due_date: "",
    billing_period_start: "",
    billing_period_end: "",
    reference: "",
    notes: "",
  });
  const [billingConfigSource, setBillingConfigSource] = useState<PlatformBillingConfig>({
    gateway_settings: {},
    tax_rules: {},
    invoice_template: {},
  });
  const [billingConfigForm, setBillingConfigForm] = useState<BillingConfigForm>(EMPTY_BILLING_CONFIG_FORM);

  const invoiceCalc = useMemo(() => {
    const quantity = Number(newInvoice.quantity || 0);
    const unitPrice = Number(newInvoice.unit_price || 0);
    const taxRate = Number(newInvoice.tax_rate_percent || 0);
    const subtotal = Math.max(0, Math.round(quantity * unitPrice));
    const taxAmount = Math.max(0, Math.round((subtotal * taxRate) / 100));
    const total = subtotal + taxAmount;
    return { quantity, unitPrice, taxRate, subtotal, taxAmount, total };
  }, [newInvoice.quantity, newInvoice.unit_price, newInvoice.tax_rate_percent]);

  const loadOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const overviewRes = await apiClient("/admin/platform/billing/overview");
      if (!overviewRes.ok) {
        throw new Error(await readAPIError(overviewRes, "Failed to load billing overview."));
      }
      const summary = await overviewRes.json();
      setOverview(summary);
    } catch (e: any) {
      setError(e?.message || "Failed to load billing overview.");
    } finally {
      setLoading(false);
    }
  };

  const loadInvoicesData = async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentsRes, invoicesRes, adjustmentsRes] = await Promise.all([
        apiClient("/admin/platform/payments?limit=200"),
        apiClient("/admin/platform/invoices?limit=200"),
        apiClient("/admin/platform/invoice-adjustments?limit=200"),
      ]);

      if (!paymentsRes.ok) {
        throw new Error(await readAPIError(paymentsRes, "Failed to load payments."));
      }
      if (!invoicesRes.ok) {
        throw new Error(await readAPIError(invoicesRes, "Failed to load invoices."));
      }
      if (!adjustmentsRes.ok) {
        throw new Error(await readAPIError(adjustmentsRes, "Failed to load invoice adjustments."));
      }

      const payments = await paymentsRes.json();
      setRows(Array.isArray(payments) ? payments : []);

      const invoiceData = await invoicesRes.json();
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);

      const adjustmentData = await adjustmentsRes.json();
      setAdjustments(Array.isArray(adjustmentData) ? adjustmentData : []);

      if (Object.keys(billingConfigSource.invoice_template || {}).length === 0) {
        const configRes = await apiClient("/admin/platform/billing/config");
        if (configRes.ok) {
          const configData = (await configRes.json()) as PlatformBillingConfig;
          const config = applyBillingConfig(configData);
          setBillingConfigSource(config.source);
          setBillingConfigForm(config.form);
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load invoice data.");
    } finally {
      setLoading(false);
    }
  };

  const loadBillingConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const configRes = await apiClient("/admin/platform/billing/config");
      if (!configRes.ok) {
        throw new Error(await readAPIError(configRes, "Failed to load billing configuration."));
      }
      const configData = (await configRes.json()) as PlatformBillingConfig;
      const config = applyBillingConfig(configData);
      setBillingConfigSource(config.source);
      setBillingConfigForm(config.form);
    } catch (e: any) {
      setError(e?.message || "Failed to load billing configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") {
      void loadOverview();
      return;
    }
    if (activeTab === "invoices") {
      void loadInvoicesData();
      return;
    }
    void loadBillingConfig();
  }, [activeTab]);

  const createInvoice = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { quantity, unitPrice, taxRate, subtotal, taxAmount, total } = invoiceCalc;
      if (!newInvoice.tenant_id) {
        throw new Error("Tenant is required.");
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Quantity must be greater than 0.");
      }
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new Error("Unit price must be greater than 0.");
      }
      if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
        throw new Error("Tax rate must be between 0 and 100.");
      }
      if (subtotal <= 0 || total <= 0) {
        throw new Error("Invoice total must be greater than 0.");
      }

      const dueDate = newInvoice.due_date ? new Date(newInvoice.due_date).toISOString() : "";
      const payload = {
        tenant_id: newInvoice.tenant_id,
        currency: newInvoice.currency || "INR",
        amount_total: subtotal,
        tax_amount: taxAmount,
        due_date: dueDate,
        line_items: [
          {
            code: (newInvoice.item_code || "subscription").trim(),
            description: (newInvoice.item_description || "Platform subscription charge").trim(),
            quantity,
            unit_price: Math.round(unitPrice),
            tax_rate_percent: taxRate,
            amount: subtotal,
          },
        ],
        metadata: {
          reference: newInvoice.reference.trim(),
          notes: newInvoice.notes.trim(),
          billing_period_start: newInvoice.billing_period_start || null,
          billing_period_end: newInvoice.billing_period_end || null,
          tax_rate_percent: taxRate,
          calculated_total: total,
        },
      };

      const res = await apiClient("/admin/platform/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to create invoice."));

      setMessage("Invoice created.");
      setNewInvoice({
        tenant_id: "",
        currency: "INR",
        item_code: "subscription",
        item_description: "Platform subscription charge",
        quantity: "1",
        unit_price: "",
        tax_rate_percent: "18",
        due_date: "",
        billing_period_start: "",
        billing_period_end: "",
        reference: "",
        notes: "",
      });
      await loadInvoicesData();
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
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to resend invoice."));
      setMessage("Invoice resend recorded.");
      await loadInvoicesData();
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
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to mark invoice paid."));
      setMessage("Invoice marked paid (offline).");
      await loadInvoicesData();
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
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to export invoice."));
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("Invoice export downloaded.");
    } catch (e: any) {
      setError(e?.message || "Failed to export invoice.");
    } finally {
      setBusy(false);
    }
  };

  const viewInvoiceAsPDF = (invoice: PlatformInvoice) => {
    const lines = Array.isArray(invoice.line_items) ? invoice.line_items : [];
    const template = billingConfigSource.invoice_template || {};
    const gateway = billingConfigSource.gateway_settings || {};
    const taxRules = billingConfigSource.tax_rules || {};
    const subtotal = Number(invoice.amount_total || 0);
    const tax = Number(invoice.tax_amount || 0);
    const total = subtotal + tax;
    const issueDate = invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : "-";
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "-";

    const lineRows = lines.length
      ? lines
          .map((line, idx) => {
            const item = line as Record<string, unknown>;
            const desc = escapeHtml(item.description ?? item.code ?? `Line ${idx + 1}`);
            const quantity = escapeHtml(item.quantity ?? "1");
            const unit = escapeHtml(item.unit_price ?? item.amount ?? "-");
            const amount = escapeHtml(item.amount ?? "-");
            return `<tr>
              <td>${idx + 1}</td>
              <td>${desc}</td>
              <td style="text-align:right">${quantity}</td>
              <td style="text-align:right">${unit}</td>
              <td style="text-align:right">${amount}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td>1</td><td>Subscription</td><td style="text-align:right">1</td><td style="text-align:right">${subtotal}</td><td style="text-align:right">${subtotal}</td></tr>`;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(invoice.invoice_number)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    .topbar { display: flex; justify-content: space-between; margin-bottom: 18px; }
    .muted { color: #555; font-size: 12px; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
    th { background: #f6f6f6; text-align: left; }
    .right { text-align: right; }
    .actions { margin: 12px 0; display: flex; gap: 8px; }
    @media print { .actions { display: none; } body { margin: 8mm; } }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button onclick="window.close()">Close</button>
  </div>
  <div class="topbar">
    <div>
      <h2 style="margin:0">${escapeHtml(asString(template.company_name, "SchoolERP Platform"))}</h2>
      <div class="muted">${escapeHtml(asString(template.support_email, ""))} ${escapeHtml(asString(template.support_phone, ""))}</div>
    </div>
    <div class="right">
      <div><strong>Invoice ${escapeHtml(invoice.invoice_number)}</strong></div>
      <div class="muted">Issued: ${escapeHtml(issueDate)}</div>
      <div class="muted">Due: ${escapeHtml(dueDate)}</div>
      <div class="muted">Status: ${escapeHtml(invoice.status || "-")}</div>
    </div>
  </div>

  <div class="card">
    <div><strong>Bill To:</strong> ${escapeHtml(invoice.tenant_name)}</div>
    <div class="muted">Tenant ID: ${escapeHtml(invoice.tenant_id)}</div>
    <div class="muted">Reference: ${escapeHtml(invoice.external_ref || asString(invoice.metadata?.reference, "-"))}</div>
    <div class="muted">Gateway: ${escapeHtml(asString(gateway.provider, "manual"))} (${escapeHtml(asString(gateway.mode, "test"))})</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <table style="margin-top:14px; width: 320px; margin-left:auto;">
    <tr><td>Subtotal</td><td class="right">${escapeHtml(subtotal)} ${escapeHtml(invoice.currency)}</td></tr>
    <tr><td>${escapeHtml(asString(taxRules.label, "Tax"))}</td><td class="right">${escapeHtml(tax)} ${escapeHtml(invoice.currency)}</td></tr>
    <tr><td><strong>Total</strong></td><td class="right"><strong>${escapeHtml(total)} ${escapeHtml(invoice.currency)}</strong></td></tr>
  </table>
  <p class="muted" style="margin-top:14px;">${escapeHtml(asString(template.footer_note, "This is a system generated invoice."))}</p>
</body>
</html>`;

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      setError("Popup blocked. Please allow popups and retry.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
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
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to create refund."));
      setMessage("Refund recorded.");
      await loadInvoicesData();
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
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to create credit note."));
      setMessage("Credit note recorded.");
      await loadInvoicesData();
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
      const defaultRate = Number(billingConfigForm.default_tax_rate_percent || 0);
      const paymentTermsDays = Number(billingConfigForm.payment_terms_days || 0);
      const lateFeePercent = Number(billingConfigForm.late_fee_percent || 0);
      if (!Number.isFinite(defaultRate) || defaultRate < 0 || defaultRate > 100) {
        throw new Error("Default tax rate must be between 0 and 100.");
      }
      if (!Number.isFinite(paymentTermsDays) || paymentTermsDays < 0 || paymentTermsDays > 3650) {
        throw new Error("Payment terms days must be between 0 and 3650.");
      }
      if (!Number.isFinite(lateFeePercent) || lateFeePercent < 0 || lateFeePercent > 100) {
        throw new Error("Late fee percent must be between 0 and 100.");
      }
      const payload = {
        gateway_settings: {
          ...billingConfigSource.gateway_settings,
          provider: billingConfigForm.provider.trim() || "manual",
          mode: billingConfigForm.mode.trim() || "test",
          merchant_id: billingConfigForm.merchant_id.trim(),
          public_key: billingConfigForm.public_key.trim(),
          webhook_url: billingConfigForm.webhook_url.trim(),
          webhook_secret: billingConfigForm.webhook_secret.trim(),
          auto_collection: billingConfigForm.auto_collection,
        },
        tax_rules: {
          ...billingConfigSource.tax_rules,
          enabled: billingConfigForm.tax_enabled,
          label: billingConfigForm.tax_label.trim() || "Tax",
          default_rate_percent: defaultRate,
          inclusive: billingConfigForm.tax_inclusive,
        },
        invoice_template: {
          ...billingConfigSource.invoice_template,
          invoice_prefix: billingConfigForm.invoice_prefix.trim() || "INV",
          payment_terms_days: paymentTermsDays,
          late_fee_percent: lateFeePercent,
          support_email: billingConfigForm.support_email.trim(),
          support_phone: billingConfigForm.support_phone.trim(),
          footer_note: billingConfigForm.footer_note.trim(),
        },
      };
      const res = await apiClient("/admin/platform/billing/config", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to save billing configuration."));

      setMessage("Billing configuration updated.");
      await loadBillingConfig();
    } catch (e: any) {
      setError(e?.message || "Failed to save billing configuration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4">
        <Link href="/platform/payments" className="flex items-center text-xs font-black text-primary hover:underline gap-1 uppercase tracking-widest">
          <ArrowRight className="h-3 w-3 rotate-180" />
          Back to Financial Control
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Billing & Payments</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Platform subscription health, collections, and payment activity.</p>
        </div>
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

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isPaymentsManageTab(value)) {
            router.push(`/platform/payments/manage?tab=${value}`);
          }
        }}
        className="space-y-6"
      >
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
        <p className="mt-1 text-sm text-muted-foreground">
          Create an itemized invoice with billing period, tax, due date, and internal notes.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tenant</p>
            <TenantSelect
              value={newInvoice.tenant_id}
              onSelect={(value) => setNewInvoice((p) => ({ ...p, tenant_id: typeof value === "string" ? value : value[0] || "" }))}
              placeholder="Search tenant..."
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Currency</p>
            <select
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={newInvoice.currency}
              onChange={(e) => setNewInvoice((p) => ({ ...p, currency: e.target.value }))}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Line item code (e.g. subscription)"
            value={newInvoice.item_code}
            onChange={(e) => setNewInvoice((p) => ({ ...p, item_code: e.target.value }))}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Line item description"
            value={newInvoice.item_description}
            onChange={(e) => setNewInvoice((p) => ({ ...p, item_description: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Quantity"
            value={newInvoice.quantity}
            onChange={(e) => setNewInvoice((p) => ({ ...p, quantity: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Unit price"
            value={newInvoice.unit_price}
            onChange={(e) => setNewInvoice((p) => ({ ...p, unit_price: e.target.value }))}
          />
          <input
            type="number"
            min={0}
            max={100}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Tax rate (%)"
            value={newInvoice.tax_rate_percent}
            onChange={(e) => setNewInvoice((p) => ({ ...p, tax_rate_percent: e.target.value }))}
          />
          <input
            type="datetime-local"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={newInvoice.due_date}
            onChange={(e) => setNewInvoice((p) => ({ ...p, due_date: e.target.value }))}
          />
          <input
            type="date"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={newInvoice.billing_period_start}
            onChange={(e) => setNewInvoice((p) => ({ ...p, billing_period_start: e.target.value }))}
            title="Billing period start"
          />
          <input
            type="date"
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={newInvoice.billing_period_end}
            onChange={(e) => setNewInvoice((p) => ({ ...p, billing_period_end: e.target.value }))}
            title="Billing period end"
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-2"
            placeholder="Reference (optional)"
            value={newInvoice.reference}
            onChange={(e) => setNewInvoice((p) => ({ ...p, reference: e.target.value }))}
          />
          <textarea
            rows={3}
            className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-2"
            placeholder="Internal notes (optional)"
            value={newInvoice.notes}
            onChange={(e) => setNewInvoice((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

        <div className="mt-4 grid gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</p>
            <p className="font-semibold text-foreground">{invoiceCalc.quantity || 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Subtotal</p>
            <p className="font-semibold text-foreground">{invoiceCalc.subtotal} {newInvoice.currency}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tax</p>
            <p className="font-semibold text-foreground">{invoiceCalc.taxAmount} {newInvoice.currency}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="font-semibold text-foreground">{invoiceCalc.total} {newInvoice.currency}</p>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={createInvoice}
            disabled={busy}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
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
                        onClick={() => viewInvoiceAsPDF(invoice)}
                        disabled={busy}
                        className="rounded border border-violet-600/40 px-2 py-1 text-xs text-violet-700 hover:bg-violet-500/10 disabled:opacity-60 dark:border-violet-700 dark:text-violet-200 dark:hover:bg-violet-900/20"
                      >
                        View PDF
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
          Configure gateway, tax, and invoice defaults using guided inputs.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gateway</p>
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Provider (manual, razorpay, stripe...)"
              value={billingConfigForm.provider}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, provider: e.target.value }))}
            />
            <select
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={billingConfigForm.mode}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, mode: e.target.value }))}
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Merchant ID"
              value={billingConfigForm.merchant_id}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, merchant_id: e.target.value }))}
            />
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Public key"
              value={billingConfigForm.public_key}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, public_key: e.target.value }))}
            />
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Webhook URL"
              value={billingConfigForm.webhook_url}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, webhook_url: e.target.value }))}
            />
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Webhook secret"
              value={billingConfigForm.webhook_secret}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, webhook_secret: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={billingConfigForm.auto_collection}
                onChange={(e) => setBillingConfigForm((p) => ({ ...p, auto_collection: e.target.checked }))}
              />
              Enable auto-collection
            </label>
          </div>
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tax Rules</p>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={billingConfigForm.tax_enabled}
                onChange={(e) => setBillingConfigForm((p) => ({ ...p, tax_enabled: e.target.checked }))}
              />
              Enable tax on invoices
            </label>
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Tax label (GST/VAT)"
              value={billingConfigForm.tax_label}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, tax_label: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Default tax rate %"
              value={billingConfigForm.default_tax_rate_percent}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, default_tax_rate_percent: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={billingConfigForm.tax_inclusive}
                onChange={(e) => setBillingConfigForm((p) => ({ ...p, tax_inclusive: e.target.checked }))}
              />
              Prices are tax-inclusive
            </label>
          </div>
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice Template</p>
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Invoice prefix (INV)"
              value={billingConfigForm.invoice_prefix}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, invoice_prefix: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              max={3650}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Payment terms (days)"
              value={billingConfigForm.payment_terms_days}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, payment_terms_days: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Late fee %"
              value={billingConfigForm.late_fee_percent}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, late_fee_percent: e.target.value }))}
            />
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Support email"
              value={billingConfigForm.support_email}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, support_email: e.target.value }))}
            />
            <input
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Support phone"
              value={billingConfigForm.support_phone}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, support_phone: e.target.value }))}
            />
            <textarea
              rows={4}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Footer note shown on invoice PDF"
              value={billingConfigForm.footer_note}
              onChange={(e) => setBillingConfigForm((p) => ({ ...p, footer_note: e.target.value }))}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          These inputs are stored under `billing.gateway_settings`, `billing.tax_rules`, and `billing.invoice_template` in platform settings.
        </p>
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
