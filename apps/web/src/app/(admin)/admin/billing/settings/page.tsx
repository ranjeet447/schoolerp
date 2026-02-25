"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button, Card, CardContent, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@schoolerp/ui";
import { CreditCard, Save, TestTube2, Webhook } from "lucide-react";
import { toast } from "sonner";

type GatewayConfig = {
  provider: string; // "razorpay" | "payu"
  is_active: boolean;
  api_key: string;
  api_secret: string;
  webhook_secret?: string;
};

type WebhookStatus = {
  provider: string;
  last_received_at?: string;
  last_completed_at?: string;
  last_status?: string;
  last_error?: string;
  received_count_24h?: number;
  completed_count_24h?: number;
  failed_count_24h?: number;
  webhook_url?: string;
};

export default function TenantGatewaySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("razorpay");
  const [testing, setTesting] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [gateway, setGateway] = useState<GatewayConfig>({
    provider: "razorpay",
    is_active: false,
    api_key: "",
    api_secret: "",
    webhook_secret: "",
  });

  const fetchGateway = async (provider: string) => {
    setLoading(true);
    try {
      // The backend route is /admin/fees/gateways?provider=... 
      // This configures the specific tenant's fee collection gateway.
      const res = await apiClient(`/admin/fees/gateways?provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        setGateway({
          provider,
          is_active: data.is_active || false,
          api_key: data.api_key || "",
          api_secret: data.api_secret || "",
          webhook_secret: data.webhook_secret || "",
        });
      } else if (res.status === 404) {
        setGateway({
          provider,
          is_active: false,
          api_key: "",
          api_secret: "",
          webhook_secret: "",
        });
      } else {
        throw new Error("Failed to load gateway configuration.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load gateway configuration");
    } finally {
      setLoading(false);
      void fetchWebhookStatus(provider);
    }
  };

  const fetchWebhookStatus = async (provider: string) => {
    try {
      const res = await apiClient(`/admin/settings/payments/gateways/webhook-status?provider=${provider}`);
      if (!res.ok) return;
      setWebhookStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    void fetchGateway(activeTab);
  }, [activeTab]);

  const handleSave = async () => {
    if (!gateway.api_key || !gateway.api_secret) {
      toast.error("API Key and Secret are required.");
      return;
    }
    setSaving(true);
    try {
      const masked = (v: string) => v.startsWith("********");
      const payload = {
        ...gateway,
        api_key: masked(gateway.api_key) ? "" : gateway.api_key,
        api_secret: masked(gateway.api_secret) ? "" : gateway.api_secret,
        webhook_secret: masked(gateway.webhook_secret || "") ? "" : (gateway.webhook_secret || ""),
      };
      const res = await apiClient("/admin/settings/payments/gateways", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save gateway configuration.");
      }
      toast.success(`${activeTab === "razorpay" ? "Razorpay" : "PayU"} configuration saved seamlessly.`);
      await fetchGateway(activeTab);
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await apiClient("/admin/settings/payments/gateways/test", {
        method: "POST",
        body: JSON.stringify({ provider: activeTab }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.message || "Connection test failed");
      }
      toast.success(data.message || "Gateway credentials verified");
      await fetchWebhookStatus(activeTab);
    } catch (err: any) {
      toast.error(err.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Gateways</h1>
          <p className="text-muted-foreground mt-1">
            Configure your merchant credentials to receive student fee payments directly to your bank account.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between bg-muted/30">
              <TabsList className="grid grid-cols-2 w-[300px]">
                <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
                <TabsTrigger value="payu">PayU</TabsTrigger>
              </TabsList>
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">
                Loading configuration...
              </div>
            ) : (
              <div className="p-6">
                <TabsContent value={activeTab} className="mt-0 space-y-6">
                  <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-lg">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-md">
                      <CreditCard className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {activeTab === "razorpay" ? "Razorpay Integration" : "PayU Integration"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your credentials are encrypted end-to-end using Envelope Encryption before being stored in our vault.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <Label className="text-base font-semibold block mb-1">
                        Enable {activeTab === "razorpay" ? "Razorpay" : "PayU"} Checkout
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        Toggle to activate this gateway as a payment option for parents.
                      </span>
                    </div>
                    <Switch
                      checked={gateway.is_active}
                      onCheckedChange={(c) => setGateway({ ...gateway, is_active: c })}
                    />
                  </div>

	                  <div className="grid gap-4">
                      <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Webhook className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Webhook Status</span>
                          </div>
                          <span className={`text-xs font-medium ${webhookStatus?.last_status === "completed" ? "text-emerald-600" : webhookStatus?.failed_count_24h ? "text-rose-600" : "text-muted-foreground"}`}>
                            {webhookStatus?.last_status || "No events yet"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground break-all">
                          URL: {webhookStatus?.webhook_url || "Loading..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          24h: {webhookStatus?.received_count_24h ?? 0} received / {webhookStatus?.completed_count_24h ?? 0} completed / {webhookStatus?.failed_count_24h ?? 0} failed
                        </p>
                        {webhookStatus?.last_received_at && (
                          <p className="text-xs text-muted-foreground">
                            Last received: {new Date(webhookStatus.last_received_at).toLocaleString()}
                          </p>
                        )}
                      </div>
	                    <div className="grid gap-2">
                      <Label>API Key / Merchant ID</Label>
                      <Input
                        value={gateway.api_key}
                        onChange={(e) => setGateway({ ...gateway, api_key: e.target.value })}
                        placeholder="rzp_live_xxxxxxxxxxx"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>API Secret / Merchant Salt</Label>
                      <Input
                        type="password"
                        value={gateway.api_secret}
                        onChange={(e) => setGateway({ ...gateway, api_secret: e.target.value })}
                        placeholder="•••••••••••••••••••••••••"
                        className="font-mono text-sm tracking-widest"
                      />
                      <p className="text-xs text-muted-foreground text-right mt-1">Stored securely via Envelope Encryption</p>
                    </div>
                    {activeTab === "razorpay" && (
                      <div className="grid gap-2 mt-2">
                        <Label>Webhook Secret <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                          type="password"
                          value={gateway.webhook_secret || ""}
                          onChange={(e) => setGateway({ ...gateway, webhook_secret: e.target.value })}
                          placeholder="Your webhook authentication secret"
                          className="font-mono text-sm tracking-widest"
                        />
                      </div>
                    )}
                  </div>

	                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t mt-8">
                      <Button type="button" variant="outline" onClick={() => void testConnection()} disabled={testing} className="gap-2">
                        <TestTube2 className="h-4 w-4" />
                        {testing ? "Testing..." : "Test Connection"}
                      </Button>
	                    <Button onClick={() => void handleSave()} disabled={saving} className="gap-2">
	                      <Save className="h-4 w-4" />
	                      {saving ? "Encrypting & Saving..." : "Save Configuration"}
	                    </Button>
	                  </div>
                </TabsContent>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
