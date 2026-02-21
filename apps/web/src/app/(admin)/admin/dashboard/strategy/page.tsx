"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Loader2, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Grid3X3, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StrategicData {
  academic_heatmap: { class_name: string; subject_name: string; average_score: number }[]
  financial_collection: { month: string; amount: number }[]
  admission_funnel: { status: string; count: number }[]
}

export default function StrategicAnalyticsPage() {
  const [data, setData] = useState<StrategicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient('/admin/dashboard/strategic-analytics')
      if (res.ok) {
        setData(await res.json())
      } else {
        setError("Failed to load strategic data")
      }
    } catch (e) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  // Process Heatmap Data
  const heatmap = useMemo(() => {
    if (!data?.academic_heatmap) return { classes: [], subjects: [], matrix: {} }
    const classes = Array.from(new Set(data.academic_heatmap.map(h => h.class_name))).sort()
    const subjects = Array.from(new Set(data.academic_heatmap.map(h => h.subject_name))).sort()
    const matrix: Record<string, Record<string, number>> = {}
    
    data.academic_heatmap.forEach(h => {
      if (!matrix[h.class_name]) matrix[h.class_name] = {}
      matrix[h.class_name][h.subject_name] = h.average_score
    })
    
    return { classes, subjects, matrix }
  }, [data])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Generating Strategic Insights...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="shrink-0 h-10 w-10">
            <Link href="/admin/dashboard">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              Strategic DSS <Badge variant="secondary" className="text-[10px] font-mono tracking-widest">ALPHA</Badge>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Decision Support System & Long-term Analytics</p>
          </div>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="gap-2 shrink-0"><Calendar className="h-4 w-4" /> Academic Year 24-25</Button>
           <Button variant="outline" className="gap-2 shrink-0"><Filter className="h-4 w-4" /> All Branches</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Performance Heatmap */}
        <Card className="lg:col-span-2 border-none shadow-sm h-full">
           <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                 <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                       <Grid3X3 className="h-5 w-5 text-primary" /> Academic Heatmap
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Average performance aggregated by class and subject</p>
                 </div>
                 <div className="flex items-center gap-4 border border-border rounded-lg px-3 py-1.5 bg-muted/30">
                    <div className="flex items-center gap-2">
                       <div className="h-2.5 w-2.5 rounded-full bg-destructive" /> <span className="text-xs text-muted-foreground font-semibold">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> <span className="text-xs text-muted-foreground font-semibold">Excellent</span>
                    </div>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                       <tr className="bg-muted/40">
                          <th className="p-4 text-left text-xs font-semibold text-muted-foreground border-b border-r">Class / Subject</th>
                          {heatmap.subjects.map(s => (
                             <th key={s} className="p-4 text-center text-xs font-semibold text-muted-foreground border-b min-w-[100px]">{s}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                       {heatmap.classes.length === 0 ? (
                         <tr><td colSpan={heatmap.subjects.length + 1} className="p-8 text-center text-sm text-muted-foreground border-b">No academic data available</td></tr>
                       ) : heatmap.classes.map(c => (
                          <tr key={c} className="border-b last:border-0 hover:bg-muted/10">
                             <td className="p-4 text-sm font-semibold text-foreground border-r bg-muted/10">{c}</td>
                             {heatmap.subjects.map(s => {
                                const score = heatmap.matrix[c][s] || 0;
                                let bgColorClass = 'bg-background';
                                let textColorClass = 'text-muted-foreground';
                                
                                if (score > 0) {
                                   if (score < 40) { bgColorClass = 'bg-destructive/10'; textColorClass = 'text-destructive'; }
                                   else if (score < 60) { bgColorClass = 'bg-orange-500/10'; textColorClass = 'text-orange-600 dark:text-orange-400'; }
                                   else if (score < 80) { bgColorClass = 'bg-primary/10'; textColorClass = 'text-primary'; }
                                   else { bgColorClass = 'bg-emerald-500/10'; textColorClass = 'text-emerald-600 dark:text-emerald-400'; }
                                }
                                
                                return (
                                   <td key={s} className={cn("p-4 text-center border-l first:border-l-0 transition-colors", bgColorClass)}>
                                      <span className={cn("text-sm font-bold", textColorClass)}>{score ? Math.round(score) + '%' : '-'}</span>
                                   </td>
                                )
                             })}
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </CardContent>
        </Card>

        {/* Admission Velocity */}
        <Card className="border-none shadow-sm flex-1">
           <CardContent className="p-6">
             <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                   <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                   <CardTitle className="text-lg">Admission Velocity</CardTitle>
                   <p className="text-sm text-muted-foreground font-medium mt-0.5">Conversion Funnel status</p>
                </div>
             </div>

             <div className="space-y-6">
                {data?.admission_funnel.map(f => (
                   <div key={f.status} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{f.status}</span>
                         <span className="text-sm font-bold text-foreground">{f.count} <span className="font-normal text-muted-foreground text-xs">Applicants</span></span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full transition-all duration-500", f.status === 'pending' ? 'bg-orange-500' : 'bg-emerald-500')} 
                           style={{ width: `${Math.min(100, (f.count / (data.admission_funnel.reduce((acc, x) => acc + x.count, 0) || 1)) * 100)}%` }} 
                         />
                      </div>
                   </div>
                ))}
                {(!data?.admission_funnel || data.admission_funnel.length === 0) && (
                   <div className="p-4 bg-muted/50 rounded-lg text-center">
                     <p className="text-sm text-muted-foreground font-medium">No application data for this period.</p>
                   </div>
                )}
             </div>

             <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs font-bold uppercase text-primary mb-2 flex items-center gap-2"><Info className="h-3.5 w-3.5" /> Primary Insight</p>
                <p className="text-sm leading-relaxed text-foreground">
                   The conversion from enquiry to admitted has increased by <span className="text-emerald-600 dark:text-emerald-400 font-bold">2.4%</span> this week. Recommend focus on <span className="font-semibold underline">Pending Review</span> queue.
                </p>
             </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Financial Growth Trends */}
         <Card className="border-none shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-10">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                       <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                       <CardTitle className="text-lg leading-tight">Financial Trajectory</CardTitle>
                       <p className="text-sm text-muted-foreground font-medium mt-1">Last 6 Months Collection Trend</p>
                    </div>
                 </div>
                 <div className="sm:text-right bg-muted/40 p-3 rounded-lg border border-border/50">
                    <p className="text-2xl font-black text-primary leading-none">₹{(data?.financial_collection.reduce((acc, f) => acc + f.amount, 0) || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground uppercase font-bold mt-1">6M Gross Volume</p>
                 </div>
              </div>

              <div className="flex items-end justify-between h-56 gap-2 sm:gap-4 pt-4 border-b border-border/50">
                 {data?.financial_collection.length === 0 ? (
                   <div className="w-full flex justify-center items-center h-full pb-8">
                     <p className="text-muted-foreground text-sm">No financial data</p>
                   </div>
                 ) : data?.financial_collection.map((f, i) => {
                    const maxAmt = Math.max(...data.financial_collection.map(x => x.amount), 1);
                    const height = Math.max(5, (f.amount / maxAmt) * 100);
                    return (
                       <div key={f.month} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                          <div className="w-full sm:w-16 relative flex justify-center flex-1 items-end">
                             <div 
                               className="w-full sm:w-12 bg-primary/80 rounded-t-xl group-hover:bg-primary transition-all cursor-pointer relative shadow-sm"
                               style={{ height: `${height}%` }}
                             >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 shadow-xl whitespace-nowrap z-10 pointer-events-none">
                                   ₹{(f.amount / 1000).toFixed(1)}k
                                </div>
                             </div>
                          </div>
                          <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider pb-2">{f.month}</span>
                       </div>
                    )
                 })}
              </div>
            </CardContent>
         </Card>

         {/* DSS Action Items */}
         <Card className="border-none shadow-sm bg-primary text-primary-foreground border">
            <CardContent className="p-8">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-primary-foreground/20 rounded-xl backdrop-blur-md">
                     <PieChart size={28} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight leading-none text-primary-foreground">Strategic Summary</h3>
               </div>
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0"><ArrowUpRight size={16} /></div>
                     <p className="text-sm font-medium opacity-90 leading-relaxed text-primary-foreground">Class 10th Mathematics indicates a <span className="font-bold underline italic">critical performance gap</span> (42% average). Prioritize extra classes or subject review.</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0"><ArrowDownRight size={16} className="text-rose-300" /></div>
                     <p className="text-sm font-medium opacity-90 leading-relaxed text-primary-foreground">Fee collection for the current month is <span className="font-bold underline italic text-rose-300">lagging by 12%</span> compared to previous cycle. automated reminders suggested.</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0"><Info size={16} /></div>
                     <p className="text-sm font-medium opacity-90 leading-relaxed text-primary-foreground">Hostel occupancy is at <span className="font-bold text-white">88%</span>. Revenue optimization possible for the remaining units.</p>
                  </div>
               </div>
               <div className="mt-10 pt-8 border-t border-primary-foreground/20">
                  <Button variant="secondary" className="w-full font-bold uppercase text-xs tracking-wider h-12 rounded-xl shadow-lg border-none hover:bg-white hover:text-primary transition-colors">Download Executive Brief (PDF)</Button>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
