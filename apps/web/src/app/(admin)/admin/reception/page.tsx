"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button,
  Badge
} from "@schoolerp/ui";
import { 
  Users, 
  ClipboardList, 
  ShieldCheck, 
  Plus, 
  ArrowRight,
  Clock,
  UserPlus,
  QrCode,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ReceptionHubPage() {
  const [stats, setStats] = useState({
    todayEnquiries: 0,
    activeVisitors: 0,
    pendingGatePasses: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [enqRes, visRes, gpRes] = await Promise.all([
        apiClient("/admin/admissions/enquiries?limit=10"),
        apiClient("/admin/safety/visitors/logs?limit=10"),
        apiClient("/admin/safety/gate-passes?limit=10")
      ]);

      if (enqRes.ok && visRes.ok && gpRes.ok) {
        const enqData = await enqRes.json();
        const visData = await visRes.json();
        const gpData = await gpRes.json();

        // Enquiries from today
        const today = new Date().toISOString().split('T')[0];
        const todayEnqCount = (Array.isArray(enqData) ? enqData : []).filter((e: any) => 
          (e.created_at?.Time || e.created_at || "").startsWith(today)
        ).length;

        setStats({
          todayEnquiries: todayEnqCount,
          activeVisitors: (Array.isArray(visData) ? visData : []).filter((l: any) => !l.check_out_at).length,
          pendingGatePasses: (Array.isArray(gpData) ? gpData : []).filter((p: any) => p.status === 'pending').length
        });

        // Combine recent activities for a unified feed if needed, 
        // but for now let's just show recent visitors as primary receptionist activity
        setRecentLogs(Array.isArray(visData) ? visData.slice(0, 5) : []);
      }
    } catch (error) {
      console.error("Failed to fetch reception data", error);
      toast.error("Failed to sync reception data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground italic uppercase">Front Desk <span className="text-primary">Ops Control</span></h1>
          <p className="text-muted-foreground font-medium mt-1">
            Real-time monitoring of campus entries, visitors, and admissions enquiries.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/safety/visitors">
            <Button className="rounded-2xl font-bold gap-2 h-12">
              <UserPlus className="w-5 h-5" /> Visitor Check-In
            </Button>
          </Link>
          <Link href="/admin/safety/gate-passes">
            <Button variant="outline" className="rounded-2xl font-bold gap-2 h-12 border-primary/20 hover:bg-primary/5">
              <QrCode className="w-5 h-5" /> Verify Gate Pass
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border/50 rounded-3xl shadow-sm hover:border-primary/30 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ClipboardList className="w-24 h-24 -mr-4 -mt-4 rotate-12" />
          </div>
          <CardHeader className="py-5">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" /> Today's Enquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-foreground">{stats.todayEnquiries}</div>
            <Link href="/admin/admissions/enquiries" className="mt-4 flex items-center text-xs font-bold text-primary gap-1 hover:underline">
              View Pipeline <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 rounded-3xl shadow-sm hover:border-emerald-500/30 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24 -mr-4 -mt-4 rotate-12" />
          </div>
          <CardHeader className="py-5">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" /> Active Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-foreground">{stats.activeVisitors}</div>
            <Link href="/admin/safety/visitors" className="mt-4 flex items-center text-xs font-bold text-emerald-500 gap-1 hover:underline">
              Manage Logs <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 rounded-3xl shadow-sm hover:border-amber-500/30 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-24 h-24 -mr-4 -mt-4 rotate-12" />
          </div>
          <CardHeader className="py-5">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-500" /> Pending Gate Passes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-foreground">{stats.pendingGatePasses}</div>
            <Link href="/admin/safety/gate-passes" className="mt-4 flex items-center text-xs font-bold text-amber-500 gap-1 hover:underline">
              Approve Requests <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Visitors */}
        <Card className="bg-card border-border/50 rounded-3xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 px-8 py-5">
            <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
               <Clock className="w-5 h-5 text-primary" /> Active Campus Visitors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentLogs.filter(l => !l.check_out_at).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic">
                No active visitors on campus right now.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentLogs.filter(l => !l.check_out_at).map((log) => (
                  <div key={log.id} className="px-8 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {log.visitor_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{log.visitor_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{log.purpose}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-foreground italic">{format(new Date(log.check_in_at), "hh:mm aa")}</p>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-tighter mt-1">Checked In</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 bg-muted/10 border-t border-border/50">
               <Link href="/admin/safety/visitors">
                <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary gap-2">
                  View Full Arrival Log <ArrowRight className="w-4 h-4" />
                </Button>
               </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips / Reception Policy */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 rounded-3xl shadow-sm overflow-hidden border-2 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-primary uppercase tracking-widest">Protocol Reminder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-black text-primary italic">01</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Verify ID for all new visitors</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Always request Aadhaar or Govt ID before completing check-in.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-black text-primary italic">02</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Enquiry Follow-ups</p>
                  <p className="text-xs text-muted-foreground mt-0.5">New enquiries should be contacted within 2 hours of submission.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-black text-primary italic">03</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Gate Pass Validation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Scan QR codes for early student exits and sync the departure log.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <Button variant="secondary" className="h-16 rounded-2xl font-black italic uppercase tracking-wider flex-col gap-1 items-start pl-6">
                <span className="text-[10px] text-muted-foreground not-italic font-bold tracking-widest">Broadcast</span>
                <span className="text-sm">Public Address</span>
             </Button>
             <Button variant="secondary" className="h-16 rounded-2xl font-black italic uppercase tracking-wider flex-col gap-1 items-start pl-6">
                <span className="text-[10px] text-muted-foreground not-italic font-bold tracking-widest">Safety</span>
                <span className="text-sm">Incident Report</span>
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
