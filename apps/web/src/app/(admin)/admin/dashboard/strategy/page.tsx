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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/admin/dashboard">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              Strategic DSS <Badge className="bg-indigo-500 text-white text-[9px]">ALPHA</Badge>
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-tighter">Decision Support System & Long-term Analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="rounded-full px-4"><Calendar className="h-3.5 w-3.5 mr-2" /> Academic Year 24-25</Button>
           <Button variant="outline" size="sm" className="rounded-full px-4"><Filter className="h-3.5 w-3.5 mr-2" /> All Branches</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Performance Heatmap */}
        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
           <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-center">
                 <div>
                    <CardTitle className="text-xl font-black flex items-center gap-2">
                       <Grid3X3 className="h-5 w-5 text-indigo-500" /> Academic Heatmap
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Average performance aggregated by class and subject</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                       <div className="h-2 w-2 rounded-full bg-rose-500" /> <span className="text-[10px] text-muted-foreground uppercase font-bold">Critical</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <div className="h-2 w-2 rounded-full bg-emerald-500" /> <span className="text-[10px] text-muted-foreground uppercase font-bold">Excellent</span>
                    </div>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-8 pt-0">
              <div className="overflow-x-auto">
                 <table className="w-full border-separate border-spacing-1">
                    <thead>
                       <tr>
                          <th className="p-2 text-left text-[10px] uppercase font-black text-muted-foreground">Class / Subject</th>
                          {heatmap.subjects.map(s => (
                             <th key={s} className="p-2 text-center text-[10px] uppercase font-black text-muted-foreground min-w-[80px]">{s}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                       {heatmap.classes.map(c => (
                          <tr key={c}>
                             <td className="p-2 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">{c}</td>
                             {heatmap.subjects.map(s => {
                                const score = heatmap.matrix[c][s] || 0;
                                const intensity = Math.min(100, score);
                                // Dynamic color based on score
                                let bgColor = 'bg-slate-100 dark:bg-slate-800';
                                if (score > 0) {
                                   if (score < 40) bgColor = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200';
                                   else if (score < 60) bgColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200';
                                   else if (score < 80) bgColor = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200';
                                   else bgColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200';
                                }
                                return (
                                   <td key={s} className={`p-3 text-center rounded-lg ${bgColor} transition-all hover:scale-105 cursor-pointer`}>
                                      <span className="text-xs font-black">{score ? Math.round(score) + '%' : '-'}</span>
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
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-6 relative overflow-hidden">
           <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                 <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                 <h3 className="text-lg font-black uppercase tracking-tight leading-none">Admission Velocity</h3>
                 <p className="text-[10px] text-slate-500 font-bold mt-1">Conversion Funnel status</p>
              </div>
           </div>

           <div className="space-y-6">
              {data?.admission_funnel.map(f => (
                 <div key={f.status} className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] uppercase font-black text-slate-500">{f.status}</span>
                       <span className="text-sm font-black">{f.count} Applicants</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${f.status === 'pending' ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                         style={{ width: `${Math.min(100, (f.count / (data.admission_funnel.reduce((acc, x) => acc + x.count, 0) || 1)) * 100)}%` }} 
                       />
                    </div>
                 </div>
              ))}
              {(!data?.admission_funnel || data.admission_funnel.length === 0) && (
                 <p className="text-xs text-slate-500 italic">No application data for this period.</p>
              )}
           </div>

           <div className="mt-10 p-4 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Primary Insight</p>
              <p className="text-xs leading-relaxed opacity-80">
                 The conversion from enquiry to admitted has increased by <span className="text-emerald-400 font-bold">2.4%</span> this week. Recommend focus on "Pending Review" queue.
              </p>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Financial Growth Trends */}
         <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-8">
            <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                     <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight leading-none">Financial Trajectory</h3>
                     <p className="text-[10px] text-muted-foreground font-bold mt-1">Last 6 Months Collection Trend</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xl font-black text-indigo-600">₹{(data?.financial_collection.reduce((acc, f) => acc + f.amount, 0) || 0).toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-black">6M Gross Volume</p>
               </div>
            </div>

            <div className="flex items-end justify-between h-48 gap-4 px-4">
               {data?.financial_collection.map((f, i) => {
                  const maxAmt = Math.max(...data.financial_collection.map(x => x.amount), 1);
                  const height = (f.amount / maxAmt) * 100;
                  return (
                     <div key={f.month} className="flex-1 flex flex-col items-center gap-3 group">
                        <div className="w-full relative">
                           <div 
                             className="w-full bg-indigo-600 rounded-2xl group-hover:bg-indigo-500 transition-all cursor-pointer relative"
                             style={{ height: `${height}%` }}
                           >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                 ₹{(f.amount / 1000).toFixed(1)}k
                              </div>
                           </div>
                        </div>
                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter whitespace-nowrap">{f.month}</span>
                     </div>
                  )
               })}
            </div>
         </Card>

         {/* DSS Action Items */}
         <div className="space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                     <PieChart size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">Strategic Summary</h3>
               </div>
               <ul className="space-y-4">
                  <li className="flex gap-3">
                     <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5"><ArrowUpRight size={12} /></div>
                     <p className="text-xs font-medium opacity-90 leading-relaxed">Class 10th Mathematics indicates a <span className="font-bold underline italic">critical performance gap</span> (42% average). Prioritize extra classes or subject review.</p>
                  </li>
                  <li className="flex gap-3">
                     <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5"><ArrowDownRight size={12} className="text-rose-300" /></div>
                     <p className="text-xs font-medium opacity-90 leading-relaxed">Fee collection for the current month is <span className="font-bold underline italic text-rose-300">lagging by 12%</span> compared to previous cycle. automated reminders suggested.</p>
                  </li>
                  <li className="flex gap-3">
                     <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5"><Info size={12} /></div>
                     <p className="text-xs font-medium opacity-90 leading-relaxed">Hostel occupancy is at <span className="font-bold">88%</span>. Revenue optimization possible for the remaining units.</p>
                  </li>
               </ul>
               <div className="mt-8">
                  <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase text-xs tracking-widest h-11 rounded-2xl shadow-lg">Download Executive Brief (PDF)</Button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
