"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@schoolerp/ui";
import { toast } from "sonner";

type LiveEvent = {
  id: string;
  title: string;
  provider: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string;
};

export default function ParentLiveClassesPage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiClient("/parent/live-classes/list");
        if (!res.ok) throw new Error("Failed to load live classes");
        const data = await res.json();
        setEvents(Array.isArray(data?.events) ? data.events : []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load live classes");
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Card>
        <CardHeader><CardTitle>Live Classes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No live classes available.</p>
          ) : events.map((e) => (
            <div key={e.id} className="rounded-lg border p-3">
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.provider} • {new Date(e.starts_at).toLocaleString()}</p>
              {e.meeting_url ? <a href={e.meeting_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Join meeting</a> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
