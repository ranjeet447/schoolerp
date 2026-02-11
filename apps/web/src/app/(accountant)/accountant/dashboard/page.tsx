"use client"

import React from 'react';
import { 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@schoolerp/ui';

export default function AccountantDashboardPage() {
  const stats = [
    { label: 'Total Revenue', value: '$240,500', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Pending Fees', value: '$12,400', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Today Coll.', value: '$4,280', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Expenses (Mo)', value: '$8,200', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Finance Overview</h1>
          <p className="text-slate-500">Welcome, Mr. Singh. You have <span className="text-amber-600 font-bold">12 pending approvals</span> today.</p>
        </div>
        <div className="px-4 py-2 bg-slate-900 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <PieChart className="h-3 w-3" /> FY 2026-27
        </div>
      </div>

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
                    { desc: 'Tuition Fee - Arjun Patel', cat: 'Income', amount: '+$1,200', status: 'Success' },
                    { desc: 'Electricity Bill - Block A', cat: 'Expense', amount: '-$450', status: 'Success' },
                    { desc: 'Bus Fee - Sana Patel', cat: 'Income', amount: '+$350', status: 'Pending' },
                    { desc: 'Stationary Purchase', cat: 'Expense', amount: '-$120', status: 'Success' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.desc}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.cat}</td>
                      <td className={`px-6 py-4 text-sm font-black ${row.amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-900'}`}>{row.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          row.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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
