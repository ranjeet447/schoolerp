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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Platform Configuration</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Manage global notification settings and platform-wide templates.</p>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {error}
        </div>
      )}

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="mb-8 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="channels" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4" />
            Notification Channels
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <SettingsIcon className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-black">Global Notification Channels</CardTitle>
              <CardDescription className="font-medium">
                Enable or disable communication channels at the platform level.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { id: "email", name: "Email Notifications", desc: "Global dispatch via SQS/SES", enabled: settings.email_enabled },
                  { id: "sms", name: "SMS Notifications", desc: "Global SMS gateway delivery", enabled: settings.sms_enabled },
                  { id: "whatsapp", name: "WhatsApp Notifications", desc: "Meta API integration", enabled: settings.whatsapp_enabled },
                  { id: "push", name: "Push Notifications", desc: "FCM/Firebase delivery", enabled: settings.push_enabled },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-black text-foreground">{item.name}</p>
                      <p className="text-xs font-medium text-muted-foreground">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      checked={item.enabled}
                      onChange={(e) => {
                        const key = `${item.id}_enabled` as keyof NotificationSettings;
                        setSettings({ ...settings, [key]: e.target.checked });
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={saveSettings} disabled={saving} className="gap-2 font-black shadow-lg shadow-primary/20 h-11">
                  <Save className="h-4 w-4" />
                  {saving ? "SAVING..." : "SAVE CONFIGURATION"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-black">Notification Templates</CardTitle>
              <CardDescription className="font-medium">Managed base templates for all tenant communications.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto border-t">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Code</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Name</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Type</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {notificationTemplates.length === 0 ? (
                      <tr>
                        <td className="px-6 py-12 text-center text-muted-foreground italic" colSpan={4}>No notification templates found.</td>
                      </tr>
                    ) : (
                      notificationTemplates.map((t) => (
                        <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-5 font-mono text-xs font-bold text-primary">{t.code}</td>
                          <td className="px-6 py-5 font-bold">{t.name}</td>
                          <td className="px-6 py-5">
                            <Badge variant="outline" className="capitalize font-black text-[10px] tracking-wide">{t.type}</Badge>
                          </td>
                          <td className="px-6 py-5">
                            <Badge className={t.is_active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 font-black" : "bg-red-500/10 text-red-700 font-black"}>
                              {t.is_active ? "ACTIVE" : "INACTIVE"}
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

          <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-black">Document Templates</CardTitle>
              <CardDescription className="font-medium">Master print templates for report cards, certificates, and receipts.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto border-t">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Code</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Name</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {documentTemplates.length === 0 ? (
                      <tr>
                        <td className="px-6 py-12 text-center text-muted-foreground italic" colSpan={3}>No document templates found.</td>
                      </tr>
                    ) : (
                      documentTemplates.map((t) => (
                        <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-5 font-mono text-xs font-bold text-primary">{t.code}</td>
                          <td className="px-6 py-5 font-bold">{t.name}</td>
                          <td className="px-6 py-5">
                            <Badge className={t.is_active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 font-black" : "bg-red-500/10 text-red-700 font-black"}>
                              {t.is_active ? "ACTIVE" : "INACTIVE"}
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
          <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-black">Infrastructure Maintenance</CardTitle>
              <CardDescription className="font-medium">Critical platform maintenance and diagnostic tools.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "Queue Health", desc: "Diagnose background worker status" },
                  { title: "Flush Redis", desc: "Clear global session/data caches" },
                  { title: "S3 Cleanup", desc: "Purge orphaned temporary files" },
                  { title: "Force Downtime", desc: "Enter emergency maintenance", danger: true },
                ].map((action) => (
                  <Button 
                    key={action.title}
                    variant="outline" 
                    className={`justify-start py-8 h-auto rounded-xl border-border bg-muted/30 hover:bg-muted/50 transition-all group ${action.danger ? "hover:border-rose-500/50 hover:bg-rose-500/5" : ""}`}
                  >
                    <div className="text-left space-y-1">
                      <p className={`text-sm font-black ${action.danger ? "text-rose-600 group-hover:text-rose-700" : "text-foreground"}`}>{action.title.toUpperCase()}</p>
                      <p className="text-[11px] font-medium text-muted-foreground">{action.desc}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
