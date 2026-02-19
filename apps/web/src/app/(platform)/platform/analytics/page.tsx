"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  BarChart3,
  Map,
  PieChart,
  Calendar,
  Plus
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@schoolerp/ui";

interface AnalyticsItem {
  timestamp: string;
  value: number;
  label: string;
}

export default function PlatformAnalyticsPage() {
  const [data, setData] = useState<AnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/admin/platform/analytics/metrics?metric=revenue&days=30");
      if (res.ok) setData(await res.json());
    } catch (e: any) {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest text-center">Compiling Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Platform Intelligence</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Growth trajectories and institution-level performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 font-bold h-11 border-border shadow-sm">
            <Filter className="h-4 w-4" />
            <span>Filter Metrics</span>
          </Button>
          <Button className="gap-2 font-black shadow-lg shadow-primary/20 h-11">
            <Download className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="mb-8 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="growth" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" />
            Growth Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4" />
            Financial Performance
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Map className="h-4 w-4" />
            Regional Adoption
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-emerald-500/10 text-emerald-600 p-3">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    12.5%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global MRR</p>
                  <h3 className="text-2xl font-black text-foreground">₹ 14.8L</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-blue-500/10 text-blue-600 p-3">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    8%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Institutions</p>
                  <h3 className="text-2xl font-black text-foreground">124</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-indigo-500/10 text-indigo-600 p-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    15%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Userbase</p>
                  <h3 className="text-2xl font-black text-foreground">8.4K</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-rose-500/10 text-rose-600 p-3">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <Badge className="bg-rose-500/10 text-rose-600 border-none font-black text-[10px]">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    2%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ecosystem Churn</p>
                  <h3 className="text-2xl font-black text-foreground">1.2%</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm shadow-black/5 overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-card/50 border-b border-border">
              <div>
                <h3 className="font-black text-foreground uppercase tracking-wider text-xs flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" /> Conversion Pipeline
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold mt-0.5">INSTITUTIONS TRANSITIONED TO PAID SUBSCRIPTIONS</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-2 text-primary font-black hover:bg-primary/5">
                <Link href="/platform/tenants/list">
                  View Portfolios <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[
                  { name: "Global Public School", location: "Bangalore", plan: "Enterprise", status: "Paid", color: "bg-indigo-600" },
                  { name: "St. Xavier Academy", location: "Mumbai", plan: "Pro", status: "Paid", color: "bg-blue-600" },
                  { name: "Delhi Heritage School", location: "New Delhi", plan: "Enterprise", status: "Paid", color: "bg-indigo-600" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-xl ${s.color} text-white flex items-center justify-center font-black shadow-lg`}>
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{s.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="font-bold text-[10px] px-3">{s.plan}</Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3">CONVERTED</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-8">
           <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-6">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-black">Plan Contribution</CardTitle>
              </div>
              <CardDescription className="font-medium">Revenue contribution and school count across billing tiers.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">Enterprise Ecosystem</span>
                    <span className="font-black text-indigo-600 uppercase tracking-tighter">62% (₹ 9.18L)</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: "62%" }}></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">Pro Growth Tier</span>
                    <span className="font-black text-blue-600 uppercase tracking-tighter">28% (₹ 4.15L)</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: "28%" }}></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">Basic & Pilot Entrants</span>
                    <span className="font-black text-amber-600 uppercase tracking-tighter">10% (₹ 1.48L)</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: "10%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-8">
          <Card className="border-none shadow-sm shadow-black/5 overflow-hidden">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 bg-card/50 border-b border-border">
              <div>
                <CardTitle className="flex items-center gap-2 font-black">
                  <Map className="h-5 w-5 text-primary" /> Regional Penetration
                </CardTitle>
                <CardDescription className="font-medium">State-wise adoption and revenue growth metrics.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-2 font-black text-muted-foreground border-border px-3 py-1">
                <Calendar className="h-3 w-3" /> LATEST 30 DAYS
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-muted/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                    <tr>
                      <th className="px-8 py-4">Region</th>
                      <th className="px-8 py-4">Growth Index</th>
                      <th className="px-8 py-4">Revenue (MTD)</th>
                      <th className="px-8 py-4">School Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { region: "Maharashtra", growth: "18%", revenue: "₹ 4,25,000", schools: 32 },
                      { region: "Karnataka", growth: "12%", revenue: "₹ 3,12,000", schools: 24 },
                      { region: "Delhi NCR", growth: "9%", revenue: "₹ 2,85,000", schools: 18 },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-black text-foreground group-hover:text-primary transition-colors">{row.region}</span>
                        </td>
                        <td className="px-8 py-5">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> {row.growth}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 font-black text-foreground">{row.revenue}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                             <span className="font-bold text-muted-foreground">{row.schools} Institutions</span>
                          </div>
                        </td>
                      </tr>
                    ))}
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
