"use client"

import React from 'react';
import { 
  Users, 
  Banknote, 
  CalendarCheck, 
  GraduationCap,
  Bell,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@schoolerp/ui';

export default function ParentDashboardPage() {
  const children = [
    { name: 'Arjun Patel', class: 'Grade 10-A', roll: '1025', attendance: '96%', color: 'rose' },
    { name: 'Sana Patel', class: 'Grade 5-C', roll: '542', attendance: '92%', color: 'indigo' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Parent Portal</h1>
          <p className="text-slate-500">Welcome back, Mr. Rajesh. Stay updated with your children's progress.</p>
        </div>
        <div className="flex -space-x-3">
          <div className="h-12 w-12 rounded-full border-4 border-white bg-rose-100 flex items-center justify-center text-rose-600 font-bold">AP</div>
          <div className="h-12 w-12 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">SP</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
            <Users className="h-5 w-5 text-rose-500" /> My Children
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <div key={child.name} className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-12 w-12 rounded-2xl bg-${child.color}-500/10 flex items-center justify-center text-${child.color}-500 font-bold`}>
                    {child.name[0]}
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Roll: {child.roll}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{child.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">{child.class}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Attendance</span>
                    <span className="text-emerald-600 font-bold">{child.attendance}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: child.attendance }} />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-rose-600 font-bold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                  View Full Profile <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>

          <Card className="bg-white border-rose-100 rounded-[2rem] shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-rose-50 flex flex-row items-center justify-between">
              <CardTitle className="text-slate-900 font-bold">Recent Updates</CardTitle>
              <Bell className="h-5 w-5 text-rose-400" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-rose-50">
                {[
                  { title: 'Fee Payment Received', desc: 'Receipt #RCP-9827 issued for Arjun Patel', date: 'Today' },
                  { title: 'Notice Published', desc: 'Annual Sports Day 2026 Schedule', date: 'Yesterday' },
                  { title: 'Exam Results declared', desc: 'Term 1 Results for Sana Patel', date: '2 days ago' },
                ].map((item, i) => (
                  <div key={i} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-black">{item.date}</span>
                    </div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
            <div className="relative z-10">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white">
                <Banknote className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Fee Balance</h3>
              <p className="text-slate-400 text-sm mb-6">Total outstanding for both children is <span className="text-white font-bold">$1,200</span>.</p>
              <button className="w-full h-12 bg-white text-slate-900 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-rose-50 transition-colors">
                Pay Fees Now
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
          </div>

          <div className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Support</span>
            </div>
            <p className="text-slate-600 text-xs mb-4">Need help with the portal or have an inquiry? </p>
            <button className="text-rose-600 font-bold text-xs uppercase tracking-widest hover:underline underline-offset-4">
              Contact School Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
