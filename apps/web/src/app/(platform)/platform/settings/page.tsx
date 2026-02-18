"use client";

"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from "@schoolerp/ui";
import { Bell, FileText, Settings as SettingsIcon, Save } from "lucide-react";

type NotificationSettings = {
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;
};

type NotificationTemplate = {
  id: string;
  name: string;
  code: string;
  type: string;
  subject_template?: string;
  body_template: string;
  is_active: boolean;
};

type DocumentTemplate = {
  id: string;
  name: string;
  code: string;
  file_url: string;
  is_active: boolean;
};

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    push_enabled: true,
  });
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, ntRes, dtRes] = await Promise.all([
        apiClient("/admin/platform/settings/notifications"),
        apiClient("/admin/platform/settings/notification-templates"),
        apiClient("/admin/platform/settings/document-templates"),
      ]);

      if (sRes.ok) setSettings(await sRes.json());
      if (ntRes.ok) setNotificationTemplates(await ntRes.json());
      if (dtRes.ok) setDocumentTemplates(await dtRes.json());
    } catch (e: any) {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await apiClient("/admin/platform/settings/notifications", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setMessage("Settings saved successfully.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-muted-foreground">Manage global notification settings and platform-wide templates.</p>
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

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="channels" className="gap-2">
            <Bell className="h-4 w-4" />
            Notification Channels
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Global Notification Channels</CardTitle>
              <CardDescription>
                Enable or disable communication channels at the platform level.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Global dispatch via SQS/SES</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={settings.email_enabled}
                    onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Global SMS gateway delivery</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={settings.sms_enabled}
                    onChange={(e) => setSettings({ ...settings, sms_enabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">WhatsApp Notifications</p>
                    <p className="text-xs text-muted-foreground">Meta API integration</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={settings.whatsapp_enabled}
                    onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">FCM/Firebase delivery</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={settings.push_enabled}
                    onChange={(e) => setSettings({ ...settings, push_enabled: e.target.checked })}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={saveSettings} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Managed base templates for all tenant communications.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Code</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Type</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {notificationTemplates.length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-muted-foreground" colSpan={4}>No notification templates available.</td>
                      </tr>
                    ) : (
                      notificationTemplates.map((t) => (
                        <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{t.code}</td>
                          <td className="px-6 py-4 font-medium">{t.name}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="capitalize">{t.type}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={t.is_active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-700"}>
                              {t.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>Master print templates for report cards, certificates, and receipts.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Code</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documentTemplates.length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-muted-foreground" colSpan={3}>No document templates available.</td>
                      </tr>
                    ) : (
                      documentTemplates.map((t) => (
                        <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{t.code}</td>
                          <td className="px-6 py-4 font-medium">{t.name}</td>
                          <td className="px-6 py-4">
                            <Badge className={t.is_active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-700"}>
                              {t.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Maintenance</CardTitle>
              <CardDescription>Critical platform maintenance and diagnostic tools.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="justify-start py-6 h-auto">
                  <div className="text-left space-y-1">
                    <p className="text-sm font-bold">Queue Health Check</p>
                    <p className="text-xs text-muted-foreground">Diagnose background worker status</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start py-6 h-auto">
                  <div className="text-left space-y-1">
                    <p className="text-sm font-bold">Flush Redis Cache</p>
                    <p className="text-xs text-muted-foreground">Clear all global session/data caches</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start py-6 h-auto">
                  <div className="text-left space-y-1">
                    <p className="text-sm font-bold">S3 Cleanup</p>
                    <p className="text-xs text-muted-foreground">Purge orphaned temporary files</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start py-6 h-auto text-red-600 hover:bg-red-50 hover:text-red-700">
                  <div className="text-left space-y-1">
                    <p className="text-sm font-bold">Force Global Downtime</p>
                    <p className="text-xs opacity-70 text-red-600">Enter emergency maintenance mode</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
