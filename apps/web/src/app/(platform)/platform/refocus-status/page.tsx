import { promises as fs } from "node:fs";
import path from "node:path";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@schoolerp/ui";

type Status = "Not Started" | "In Progress" | "Done";

type ChecklistItem = {
  id: string;
  label: string;
  status: Status;
};

type Pillar = {
  pillar_id: string;
  name: string;
  keywords: string[];
  web_app_changes: ChecklistItem[];
  marketing_changes: ChecklistItem[];
  test_updates: ChecklistItem[];
};

type RefocusTracker = {
  version: number;
  owner: string;
  last_updated: string;
  advanced_modules_policy: {
    status: Status;
    description: string;
  };
  pillars: Pillar[];
  global_checks: ChecklistItem[];
};

async function loadTracker(): Promise<RefocusTracker | null> {
  try {
    const filePath = path.resolve(process.cwd(), "../../docs/feature-tracking/refocus.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as RefocusTracker;
  } catch {
    return null;
  }
}

function pillStatusStats(pillar: Pillar) {
  const items = [...pillar.web_app_changes, ...pillar.marketing_changes, ...pillar.test_updates];
  const done = items.filter((i) => i.status === "Done").length;
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0, items };
}

export default async function PlatformRefocusStatusPage() {
  const tracker = await loadTracker();

  if (!tracker) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Refocus Status</h1>
        <p className="text-sm text-muted-foreground">Tracker file not found: `docs/feature-tracking/refocus.json`.</p>
      </div>
    );
  }

  const pillarSummaries = tracker.pillars.map((pillar) => ({ pillar, stats: pillStatusStats(pillar) }));
  const globalDone = tracker.global_checks.filter((item) => item.status === "Done").length;
  const globalTotal = tracker.global_checks.length;
  const totalDone = pillarSummaries.reduce((acc, item) => acc + item.stats.done, 0) + globalDone;
  const totalItems = pillarSummaries.reduce((acc, item) => acc + item.stats.total, 0) + globalTotal;
  const overallPercent = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refocus Status</h1>
          <p className="text-sm text-muted-foreground">
            Naming + SEO refocus tracker for web and marketing surfaces (source: `docs/feature-tracking/refocus.json`).
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          {overallPercent}% complete • updated {tracker.last_updated}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pillarSummaries.map(({ pillar, stats }) => (
          <Card key={pillar.pillar_id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{pillar.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold">{stats.done}/{stats.total} ({stats.percent}%)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${stats.percent}%` }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {pillar.keywords.slice(0, 4).map((keyword) => (
                  <span key={keyword} className="rounded-full border px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="space-y-2 pt-1">
                {stats.items.filter((item) => item.status !== "Done").length === 0 ? (
                  <p className="text-xs text-emerald-600">No pending items.</p>
                ) : (
                  stats.items
                    .filter((item) => item.status !== "Done")
                    .map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-2">
                        <p className="text-xs">{item.label}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {item.status}
                        </Badge>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Global Hardening Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-semibold">
              {globalDone}/{globalTotal} ({globalTotal ? Math.round((globalDone / globalTotal) * 100) : 0}%)
            </span>
          </div>
          <div className="space-y-2">
            {tracker.global_checks.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-2">
                <p className="text-xs">{item.label}</p>
                <Badge variant={item.status === "Done" ? "secondary" : "outline"} className="shrink-0 text-[10px]">
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
