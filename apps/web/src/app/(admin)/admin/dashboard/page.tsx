"use client"

import React from 'react';
import { 
  Users, 
  GraduationCap, 
  Banknote, 
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@schoolerp/ui';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Students', value: '1,284', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Staff Members', value: '42', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Fee Collection', value: '$45,200', icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'System Health', value: 'Optimal', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-400">Welcome back, Administrator. Here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +12% from last month
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/50 border-white/5 rounded-3xl backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-white/5 p-6">
            <CardTitle className="text-white font-black text-xl uppercase tracking-tight">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Multiple Students Attendance Marked</p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Class 10-A • 10:45 AM</p>
                  </div>
                  <div className="text-slate-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-white/10 rounded-full blur-3xl" />
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">System Notice</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Server maintenance scheduled for Sunday at 02:00 AM UTC. Plan accordingly.</p>
            <Button className="w-full bg-white text-indigo-600 font-black tracking-widest uppercase text-xs hover:bg-indigo-50">View Details</Button>
          </div>

          <div className="bg-slate-900/50 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Action Required</span>
            </div>
            <p className="text-slate-300 text-sm mb-4">3 admission applications are pending final approval.</p>
            <Button variant="ghost" className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 font-bold uppercase text-xs tracking-widest">Approve Now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
