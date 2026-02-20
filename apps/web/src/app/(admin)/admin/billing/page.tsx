"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Badge, Button, Card, CardContent, Input, Textarea } from "@schoolerp/ui";
import { Plus, RefreshCcw, Search } from "lucide-react";

type BillingControls = {
  subscription_status: string;
  billing_locked: boolean;
  lock_reason?: string;
  billing_frozen: boolean;
  freeze_reason?: string;
  grace_period_ends_at?: string;
  updated_at?: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  currency: string;
  amount_total: number;
  tax_amount: number;
  status: string;
  due_date?: string;
  issued_at?: string;
  paid_at?: string;
  external_ref?: string;
};

type PluginItem = {
  metadata: {
    id: string;
    name: string;
    description?: string;
    category?: string;
  };
  enabled: boolean;
};

type AddonActivationRequest = {
  id: string;
  status: string;
  payload?: {
    addon_id?: string;
    review_notes?: string;
  };
  created_at: string;
};

function formatDate(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAmount(currency: string, value: number): string {
  return `${Number(value || 0).toLocaleString("en-IN")} ${currency || "INR"}`;
}

export default function AdminBillingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [controls, setControls] = useState<BillingControls | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [requests, setRequests] = useState<AddonActivationRequest[]>([]);
  const [requestingAddonID, setRequestingAddonID] = useState("");
  const [addonNote, setAddonNote] = useState("");
  const [addonLoadingID, setAddonLoadingID] = useState("");

  const load = async (status = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const [controlsRes, invoicesRes, pluginsRes, requestsRes] = await Promise.all([
        apiClient("/admin/tenant/billing"),
        apiClient(`/admin/tenant/invoices?limit=100${status ? `&status=${encodeURIComponent(status)}` : ""}`),
        apiClient("/admin/tenants/plugins"),
        apiClient("/admin/tenants/addon-requests?limit=100"),
      ]);

      if (!controlsRes.ok) {
        throw new Error("Failed to load billing controls.");
      }
      const controlsData = await controlsRes.json();
      setControls(controlsData || null);

      if (!invoicesRes.ok) {
        throw new Error("Failed to load invoices.");
      }
      const invoiceRows = await invoicesRes.json();
      setInvoices(Array.isArray(invoiceRows) ? invoiceRows : []);

      if (pluginsRes.ok) {
        const pluginData = await pluginsRes.json();
        setPlugins(Array.isArray(pluginData?.plugins) ? pluginData.plugins : []);
      } else {
        setPlugins([]);
      }

      if (requestsRes.ok) {
        const requestData = await requestsRes.json();
        setRequests(Array.isArray(requestData?.requests) ? requestData.requests : []);
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load billing data.");
      setControls(null);
      setInvoices([]);
      setPlugins([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load("");
  }, []);

  useEffect(() => {
    void load(statusFilter);
  }, [statusFilter]);

  const filteredInvoices = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((row) => {
      const invoiceNumber = String(row.invoice_number || "").toLowerCase();
      const externalRef = String(row.external_ref || "").toLowerCase();
      return invoiceNumber.includes(query) || externalRef.includes(query);
    });
  }, [invoices, searchText]);

  const latestRequestByAddon = useMemo(() => {
    return requests.reduce<Record<string, AddonActivationRequest>>((acc, req) => {
      const addonID = req?.payload?.addon_id;
      if (!addonID) return acc;
      const existing = acc[addonID];
      if (!existing || new Date(req.created_at).getTime() > new Date(existing.created_at).getTime()) {
        acc[addonID] = req;
      }
      return acc;
    }, {});
  }, [requests]);

  const activeAddons = useMemo(() => plugins.filter((plugin) => plugin.enabled), [plugins]);
  const availableAddons = useMemo(() => plugins.filter((plugin) => !plugin.enabled), [plugins]);

  const requestAddon = async (addonID: string) => {
    if (!addonID) return;
    setAddonLoadingID(addonID);
    try {
      const res = await apiClient("/admin/tenants/addon-requests", {
        method: "POST",
        body: JSON.stringify({
          addon_id: addonID,
          reason: addonNote.trim(),
        }),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to submit add-on request.");
      }
      setAddonNote("");
      setRequestingAddonID("");
      await load(statusFilter);
    } catch (err: any) {
      setError(err?.message || "Failed to submit add-on request.");
    } finally {
      setAddonLoadingID("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Platform Billing</h1>
          <p className="text-sm text-muted-foreground">
            Subscription controls and issued SaaS invoices for this tenant account.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subscription</p>
            <p className="mt-2 text-lg font-black capitalize text-foreground">{controls?.subscription_status || "unknown"}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing lock</p>
            <div className="mt-2">
              <Badge variant={controls?.billing_locked ? "destructive" : "secondary"}>
                {controls?.billing_locked ? "Locked" : "Unlocked"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{controls?.lock_reason || "-"}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing freeze</p>
            <div className="mt-2">
              <Badge variant={controls?.billing_frozen ? "default" : "secondary"}>
                {controls?.billing_frozen ? "Frozen" : "Active"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{controls?.freeze_reason || "-"}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grace period</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(controls?.grace_period_ends_at)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Updated: {formatDate(controls?.updated_at)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-black text-foreground">Invoices</h2>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative w-full sm:w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search invoice or reference"
                  className="pl-9"
                />
              </div>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="void">Void</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Invoice</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Due</th>
                  <th className="px-3 py-2 text-left">Paid</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                  <th className="px-3 py-2 text-right">Tax</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {loading ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const subtotal = Number(invoice.amount_total || 0);
                    const tax = Number(invoice.tax_amount || 0);
                    const total = subtotal + tax;
                    return (
                      <tr key={invoice.id}>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-foreground">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{invoice.external_ref || "-"}</p>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="capitalize">
                            {invoice.status || "unknown"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(invoice.due_date)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatDate(invoice.paid_at)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {formatAmount(invoice.currency, subtotal)}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {formatAmount(invoice.currency, tax)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground">
                          {formatAmount(invoice.currency, total)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black text-foreground">Add-on Billing</h2>
            <p className="text-sm text-muted-foreground">
              Manage active paid add-ons and request activation for new add-ons.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active add-ons</p>
              {activeAddons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active add-ons.</p>
              ) : (
                <div className="space-y-2">
                  {activeAddons.map((addon) => (
                    <div key={addon.metadata.id} className="rounded-md border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{addon.metadata.name}</p>
                          <p className="text-xs text-muted-foreground">{addon.metadata.description || "No description"}</p>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available add-ons</p>
              {availableAddons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No additional add-ons available.</p>
              ) : (
                <div className="space-y-2">
                  {availableAddons.map((addon) => {
                    const req = latestRequestByAddon[addon.metadata.id];
                    const reqStatus = (req?.status || "").toLowerCase();
                    const requestLocked = reqStatus === "pending" || reqStatus === "approved";
                    const isExpanded = requestingAddonID === addon.metadata.id;
                    return (
                      <div key={addon.metadata.id} className="rounded-md border border-border/70 bg-muted/20 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{addon.metadata.name}</p>
                            <p className="text-xs text-muted-foreground">{addon.metadata.description || "No description"}</p>
                            {req ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Latest request: <span className="font-medium capitalize">{req.status}</span>
                                {req.payload?.review_notes ? ` • ${req.payload.review_notes}` : ""}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            {reqStatus ? (
                              <Badge variant="secondary" className="capitalize">
                                {reqStatus}
                              </Badge>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => setRequestingAddonID(isExpanded ? "" : addon.metadata.id)}
                              disabled={requestLocked}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {requestLocked ? "Requested" : "Add"}
                            </Button>
                          </div>
                        </div>

                        {isExpanded && !requestLocked ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={addonNote}
                              onChange={(e) => setAddonNote(e.target.value)}
                              rows={3}
                              placeholder="Reason for add-on request (optional)"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => void requestAddon(addon.metadata.id)}
                                disabled={addonLoadingID === addon.metadata.id}
                              >
                                {addonLoadingID === addon.metadata.id ? "Submitting..." : "Submit Request"}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
