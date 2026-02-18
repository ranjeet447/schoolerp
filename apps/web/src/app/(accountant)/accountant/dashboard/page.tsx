"use client"

import React, { useEffect, useState } from 'react';
import { 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PieChart,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';

export default function AccountantDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [headsCount, setHeadsCount] = useState(0)
  const [seriesCount, setSeriesCount] = useState(0)
  const [ledgerMappingsCount, setLedgerMappingsCount] = useState(0)

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const [headsRes, seriesRes, mappingsRes] = await Promise.all([
        apiClient("/accountant/fees/heads"),
        apiClient("/accountant/receipts/series"),
        apiClient("/accountant/payments/ledger-mappings"),
      ])

      if (headsRes.ok) {
        const headsPayload = await headsRes.json()
        const heads = Array.isArray(headsPayload) ? headsPayload : headsPayload?.data || []
        setHeadsCount(heads.length)
      } else {
        setHeadsCount(0)
      }

      if (seriesRes.ok) {
        const seriesPayload = await seriesRes.json()
        const series = Array.isArray(seriesPayload) ? seriesPayload : seriesPayload?.data || []
        setSeriesCount(series.length)
      } else {
        setSeriesCount(0)
      }

      if (mappingsRes.ok) {
        const mappingsPayload = await mappingsRes.json()
        const mappings = Array.isArray(mappingsPayload) ? mappingsPayload : mappingsPayload?.data || []
        setLedgerMappingsCount(mappings.length)
      } else {
        setLedgerMappingsCount(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance dashboard")
      setHeadsCount(0)
      setSeriesCount(0)
      setLedgerMappingsCount(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard(false)
  }, [])

  const stats = [
    { label: 'Fee Heads', value: String(headsCount), icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Receipt Series', value: String(seriesCount), icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Ledger Mappings', value: String(ledgerMappingsCount), icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Collections API', value: 'Live', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Finance Overview</h1>
          <p className="text-slate-500">Operational finance setup, receipt controls, and ledger integrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-slate-900 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <PieChart className="h-3 w-3" /> Finance Console
          </div>
          <Button variant="outline" onClick={() => loadDashboard(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
      {loading && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading finance dashboard...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-amber-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-amber-100 rounded-3xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-amber-50 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 font-bold">Recent Transactions</CardTitle>
            <span className="text-xs text-amber-600 font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer">
              Export CSV <ArrowUpRight className="h-3 w-3" />
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Description</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Category</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {[
                    { desc: 'Fee heads configured', cat: 'Setup', amount: String(headsCount), status: 'Live' },
                    { desc: 'Receipt series active', cat: 'Controls', amount: String(seriesCount), status: 'Live' },
                    { desc: 'Ledger mappings linked', cat: 'Accounting', amount: String(ledgerMappingsCount), status: 'Live' },
                    { desc: 'Offline collection endpoint', cat: 'Collections', amount: 'Ready', status: 'Live' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.desc}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.cat}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{row.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          row.status === 'Live' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-600 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-amber-600/20">
          <div>
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight">Reconcile Daily Accounts</h3>
            <p className="text-amber-100 text-sm leading-relaxed">Ensure all offline collections are recorded before end of day.</p>
          </div>
          <Button className="bg-white text-amber-600 font-black tracking-widest uppercase text-xs h-12 rounded-xl hover:bg-amber-50 mt-8">
            Start Reconciliation
          </Button>
        </div>
      </div>
    </div>
  );
}
