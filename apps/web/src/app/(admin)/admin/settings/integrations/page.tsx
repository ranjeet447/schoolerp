"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@schoolerp/ui";
import { toast } from "sonner";

type IntegrationRow = {
  provider: string;
  status: string;
  account_email?: string;
  addon_code: string;
  addon_active: boolean;
  features?: string[];
};

export default function AdminIntegrationsSettingsPage() {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/admin/settings/integrations");
      if (!res.ok) throw new Error("Failed to load integrations");
      const data = await res.json();
      setRows(Array.isArray(data?.integrations) ? data.integrations : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const connect = async (provider: string) => {
    setBusy(provider + ":connect");
    try {
      const res = await apiClient(`/admin/settings/integrations/${provider}/connect`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start connect");
      if (data?.auth_url) {
        window.location.href = data.auth_url;
        return;
      }
      toast.success("Connect flow started");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect");
    } finally {
      setBusy("");
    }
  };

  const disconnect = async (provider: string) => {
    setBusy(provider + ":disconnect");
    try {
      const res = await apiClient(`/admin/settings/integrations/${provider}/disconnect`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast.success("Disconnected");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Google Workspace for Education or Microsoft 365 Education. No passwords are stored; OAuth tokens are stored encrypted.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(loading ? [1, 2] : rows).map((item: any, idx) => {
          if (loading) {
            return <Card key={idx}><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card>;
          }
          const row = item as IntegrationRow;
          const busyConnect = busy === `${row.provider}:connect`;
          const busyDisconnect = busy === `${row.provider}:disconnect`;
          const providerLabel = row.provider === "google_workspace" ? "Google Workspace for Education" : "Microsoft 365 Education";
          return (
            <Card key={row.provider}>
              <CardHeader>
                <CardTitle className="text-lg">{providerLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium text-foreground">{row.status || "not_connected"}</span>
                  {row.account_email ? ` (${row.account_email})` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  Add-on: <code className="text-xs">{row.addon_code}</code> {row.addon_active ? "enabled" : "not enabled"}
                </p>
                {Array.isArray(row.features) && row.features.length > 0 && (
                  <p className="text-xs text-muted-foreground">Unlocks: {row.features.join(", ")}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => void connect(row.provider)}
                    disabled={busyConnect}
                  >
                    {busyConnect ? "Connecting..." : row.status === "connected" ? "Reconnect" : "Connect"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void disconnect(row.provider)}
                    disabled={busyDisconnect}
                  >
                    {busyDisconnect ? "Disconnecting..." : "Disconnect"}
                  </Button>
                  {!row.addon_active && (
                    <Button type="button" variant="secondary" onClick={() => { window.location.href = "/admin/billing?tab=addons"; }}>
                      Upgrade Add-on
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
