"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Badge, Button, Card, CardContent, Input, Textarea, Tabs, TabsContent, TabsList, TabsTrigger } from "@schoolerp/ui";
import { Plus, RefreshCcw, Search, ExternalLink, Receipt, LayoutGrid } from "lucide-react";

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
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription, view invoices, and add powerful new features.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2 shrink-0">
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Subscription Plan</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold capitalize text-foreground">{controls?.subscription_status || "Unknown"}</span>
                </div>
                {controls?.subscription_status === "active" && (
                   <Button variant="link" className="px-0 h-auto mt-2 text-indigo-600">Change Plan <ExternalLink className="h-3 w-3 ml-1" /></Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Billing Lock</p>
                <div className="mt-2 text-2xl font-bold text-foreground">
                    {controls?.billing_locked ? (
                      <span className="text-destructive">Locked</span>
                    ) : (
                      <span className="text-emerald-600">Unlocked</span>
                    )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate">{controls?.lock_reason || "Account is in good standing"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Billing Freeze</p>
                <div className="mt-2 text-2xl font-bold text-foreground">
                    {controls?.billing_frozen ? (
                      <span className="text-amber-600">Frozen</span>
                    ) : (
                      <span className="text-emerald-600">Active</span>
                    )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate">{controls?.freeze_reason || "Normal billing cycle"}</p>
              </CardContent>
            </Card>

            <Card>
               <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Next Invoice</p>
                <div className="mt-2 text-2xl font-bold text-foreground">
                    {formatDate(controls?.grace_period_ends_at)}
                </div>
                 <p className="mt-1 text-xs text-muted-foreground">Grace period end</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="addons" className="space-y-6">
          <Card>
             <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                  <LayoutGrid className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Premium Add-ons</h2>
                  <p className="text-sm text-muted-foreground mt-1">Enhance your SchoolERP with specialized features.</p>
                </div>
              </div>

               <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground border-b pb-2">Active</h3>
                  {activeAddons.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">No active add-ons.</p>
                  ) : (
                    <div className="grid gap-3">
                      {activeAddons.map((addon) => (
                        <div key={addon.metadata.id} className="relative overflow-hidden rounded-xl border p-4 bg-muted/30">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{addon.metadata.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{addon.metadata.description || "No description provided."}</p>
                            </div>
                            <Badge variant="default" className="shrink-0">Active</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-foreground border-b pb-2">Available</h3>
                  {availableAddons.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">All add-ons are currently active!</p>
                  ) : (
                    <div className="grid gap-3">
                      {availableAddons.map((addon) => {
                        const req = latestRequestByAddon[addon.metadata.id];
                        const reqStatus = (req?.status || "").toLowerCase();
                        const requestLocked = reqStatus === "pending" || reqStatus === "approved";
                        const isExpanded = requestingAddonID === addon.metadata.id;
                        
                        return (
                          <div key={addon.metadata.id} className={`rounded-xl border transition-colors ${isExpanded ? 'border-primary ring-1 ring-primary/20' : 'bg-card hover:bg-muted/50'}`}>
                            <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{addon.metadata.name}</p>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{addon.metadata.description || "No description provided."}</p>
                                {req && (
                                  <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 w-fit px-2 py-0.5 rounded">
                                    Status: <span className="capitalize">{req.status}</span>
                                    {req.payload?.review_notes ? ` • ${req.payload.review_notes}` : ""}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setRequestingAddonID(isExpanded ? "" : addon.metadata.id)}
                                  disabled={requestLocked}
                                  variant="secondary"
                                >
                                  {requestLocked ? "Requested" : "Request"}
                                </Button>
                              </div>
                            </div>

                            {isExpanded && !requestLocked && (
                              <div className="px-4 pb-4 pt-2 border-t bg-muted/20">
                                <Textarea
                                  value={addonNote}
                                  onChange={(e) => setAddonNote(e.target.value)}
                                  rows={2}
                                  className="mb-3 text-sm bg-background"
                                  placeholder="Why do you need this add-on? (Optional)"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setRequestingAddonID("")}>Cancel</Button>
                                  <Button
                                    size="sm"
                                    onClick={() => void requestAddon(addon.metadata.id)}
                                    disabled={addonLoadingID === addon.metadata.id}
                                  >
                                    {addonLoadingID === addon.metadata.id ? "Submitting..." : "Submit Request"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
           <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                    <Receipt className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Billing History</h2>
                    <p className="text-sm text-muted-foreground mt-1">Past invoices and receipts.</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search invoices..."
                      className="pl-9 bg-background"
                    />
                  </div>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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

              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground border-b uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Invoice</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Due Date</th>
                      <th className="px-4 py-3 text-left font-medium">Paid On</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                          Loading history...
                        </td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                          {searchText ? "No invoices found for this search." : "No invoices found."}
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const total = Number(invoice.amount_total || 0) + Number(invoice.tax_amount || 0);
                        return (
                          <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-foreground">{invoice.invoice_number}</p>
                              {invoice.external_ref && <p className="text-xs text-muted-foreground mt-0.5">{invoice.external_ref}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "secondary"} 
                                className="capitalize"
                              >
                                {invoice.status || "unknown"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.due_date)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.paid_at)}</td>
                            <td className="px-4 py-3 text-right font-semibold">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
