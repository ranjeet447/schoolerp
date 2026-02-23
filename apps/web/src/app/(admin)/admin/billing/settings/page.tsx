"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button, Card, CardContent, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@schoolerp/ui";
import { CreditCard, Save } from "lucide-react";
import { toast } from "sonner";

type GatewayConfig = {
  provider: string; // "razorpay" | "payu"
  is_active: boolean;
  api_key: string;
  api_secret: string;
  webhook_secret?: string;
};

export default function TenantGatewaySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("razorpay");
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
    }
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
      const res = await apiClient("/admin/fees/gateways", {
        method: "POST",
        body: JSON.stringify(gateway),
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

                  <div className="flex justify-end pt-4 border-t mt-8">
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
