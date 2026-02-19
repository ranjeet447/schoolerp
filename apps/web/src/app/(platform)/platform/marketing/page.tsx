"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  Megaphone, 
  BookOpen, 
  Send, 
  Calendar, 
  CheckCircle2, 
  Plus,
  History,
  Tag,
  ArrowRight,
  Activity
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger, 
  Badge 
} from "@schoolerp/ui";

type Announcement = {
  id: string;
  title: string;
  content: string;
  target_cohorts: string[];
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

type Changelog = {
  id: string;
  version: string;
  title: string;
  type: string;
  published_at: string;
};

export default function PlatformMarketingPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    target_cohorts_csv: "all",
    starts_at: "",
    ends_at: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        apiClient("/admin/platform/marketing/announcements"),
        apiClient("/admin/platform/marketing/changelogs"),
      ]);

      if (aRes.ok) {
        const data = await aRes.json();
        setAnnouncements(Array.isArray(data) ? data : data.data || []);
      }
      if (cRes.ok) {
        const data = await cRes.json();
        setChangelogs(Array.isArray(data) ? data : data.data || []);
      }
    } catch (e: any) {
      setError("Failed to load marketing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const createAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: createForm.title,
        content: createForm.content,
        target_cohorts: createForm.target_cohorts_csv.split(",").map(c => c.trim()),
        starts_at: createForm.starts_at || new Date().toISOString(),
        ends_at: createForm.ends_at || new Date(Date.now() + 7200000).toISOString(),
        is_active: true,
      };

      const res = await apiClient("/admin/platform/marketing/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create announcement");
      
      setCreateForm({
        title: "",
        content: "",
        target_cohorts_csv: "all",
        starts_at: "",
        ends_at: "",
      });
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && announcements.length === 0) return <div className="p-6">Loading marketing intelligence...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing & Communication</h1>
          <p className="text-muted-foreground">Manage platform announcements and maintain the product changelog.</p>
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="changelog" className="gap-2">
            <History className="h-4 w-4" />
            Product Changelog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Send className="h-5 w-5" />
                  Post New Announcement
                </CardTitle>
                <CardDescription>Broadcast news, updates, or alerts to platform users.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createAnnouncement} className="space-y-4">
                  <div className="space-y-3">
                    <input
                      className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                      placeholder="Announcement Title"
                      required
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    />
                    <textarea
                      className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none min-h-[120px]"
                      placeholder="Content (Markdown supported)"
                      required
                      value={createForm.content}
                      onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Cohorts</label>
                      <input
                        className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                        placeholder="CSV: all, trial, pro, enterprise"
                        value={createForm.target_cohorts_csv}
                        onChange={(e) => setCreateForm({ ...createForm, target_cohorts_csv: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Starts At</label>
                        <input
                          type="datetime-local"
                          className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                          value={createForm.starts_at}
                          onChange={(e) => setCreateForm({ ...createForm, starts_at: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ends At</label>
                        <input
                          type="datetime-local"
                          className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                          value={createForm.ends_at}
                          onChange={(e) => setCreateForm({ ...createForm, ends_at: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full gap-2">
                    <Megaphone className="h-4 w-4" />
                    {saving ? "Posting..." : "Broadcast Announcement"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 px-1">
                <Activity className="h-4 w-4 text-emerald-500" />
                Live Feed
              </h3>
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground bg-accent/10">
                    No active announcements found.
                  </div>
                ) : announcements.map((a) => (
                  <Card key={a.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base">{a.title}</h4>
                        <Badge className={a.is_active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20" : "bg-muted text-muted-foreground"}>
                          {a.is_active ? "Active" : "Archived"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{a.content}</p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1 border-t">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Ends {new Date(a.ends_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {(a.target_cohorts || []).join(", ")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="changelog" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">Product Evolution</h3>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-3 w-3" />
              New Version Link
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {changelogs.length === 0 ? (
              <div className="lg:col-span-3 rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground bg-accent/5">
                No changelog entries recorded.
              </div>
            ) : changelogs.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="font-mono">v{c.version}</Badge>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 border-indigo-100">{c.type}</Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">{c.title}</CardTitle>
                  <CardDescription>
                    Published on {new Date(c.published_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between group p-0 h-auto hover:bg-transparent text-primary hover:text-primary/80">
                    <span className="text-xs font-bold uppercase tracking-wider">View Full Notes</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
