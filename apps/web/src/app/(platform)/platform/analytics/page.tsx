"use client";

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
  Calendar
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

type AnalyticsItem = {
  id: string;
  metric_name: string;
  metric_value: number;
  dimensions: Record<string, any>;
  snapshot_date: string;
};

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

  if (loading && data.length === 0) return <div className="p-6">Loading platform intelligence...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Intelligence</h1>
          <p className="text-muted-foreground">High-level growth, revenue, and adoption metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="growth" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Growth Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-2">
            <Map className="h-4 w-4" />
            Regional Adoption
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-emerald-500/10 text-emerald-600 p-2">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    12.5%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MRR</p>
                  <p className="text-2xl font-black">₹ 14.8L</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-blue-500/10 text-blue-600 p-2">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    8%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Schools</p>
                  <p className="text-2xl font-black">124</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-indigo-500/10 text-indigo-600 p-2">
                    <Users className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    15%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Users</p>
                  <p className="text-2xl font-black">8.4K</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-amber-500/10 text-amber-600 p-2">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    2%
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Churn Rate</p>
                  <p className="text-2xl font-black">1.2%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Signups & Conversions</CardTitle>
                <CardDescription>Schools that recently transitioned from trial to paid.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold">
                View All <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {[
                  { name: "Global Public School", location: "Bangalore", plan: "Enterprise", status: "Paid" },
                  { name: "St. Xavier Academy", location: "Mumbai", plan: "Pro", status: "Paid" },
                  { name: "Delhi Heritage School", location: "New Delhi", plan: "Enterprise", status: "Paid" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{s.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{s.plan}</Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-700">Converted</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Plan Distribution
              </CardTitle>
              <CardDescription>Revenue contribution and school count across billing plans.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Enterprise Plan</span>
                    <span className="font-black">62% (₹ 9.18L)</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600" style={{ width: "62%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Pro Plan</span>
                    <span className="font-black">28% (₹ 4.15L)</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: "28%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Basic Plan</span>
                    <span className="font-black">10% (₹ 1.48L)</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: "10%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-orange-500" />
                  Regional Performance
                </CardTitle>
                <CardDescription>State-wise adoption and revenue growth metrics.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" /> Latest 30 Days
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Region</th>
                      <th className="px-6 py-3">Growth</th>
                      <th className="px-6 py-3">Revenue (MTD)</th>
                      <th className="px-6 py-3">Schools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-bold">Maharashtra</td>
                      <td className="px-6 py-4 text-emerald-500 font-bold">+18%</td>
                      <td className="px-6 py-4 font-mono">₹ 4,25,000</td>
                      <td className="px-6 py-4">32</td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-bold">Karnataka</td>
                      <td className="px-6 py-4 text-emerald-500 font-bold">+12%</td>
                      <td className="px-6 py-4 font-mono">₹ 3,12,000</td>
                      <td className="px-6 py-4">24</td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-bold">Delhi NCR</td>
                      <td className="px-6 py-4 text-emerald-500 font-bold">+9%</td>
                      <td className="px-6 py-4 font-mono">₹ 2,85,000</td>
                      <td className="px-6 py-4">18</td>
                    </tr>
                    <tr className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-bold">Tamil Nadu</td>
                      <td className="px-6 py-4 text-blue-500 font-bold">+4%</td>
                      <td className="px-6 py-4 font-mono">₹ 2,10,000</td>
                      <td className="px-6 py-4">15</td>
                    </tr>
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
