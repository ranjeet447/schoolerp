"use client"

import React from 'react';
import { 
  Users, 
  CalendarCheck, 
  BookOpen, 
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@schoolerp/ui';

export default function TeacherDashboardPage() {
  const stats = [
    { label: 'My Students', value: '142', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Classes Today', value: '6', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Attendance Ratio', value: '94%', icon: CalendarCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Messages', value: '12', icon: MessageSquare, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Academic Overview</h1>
          <p className="text-slate-500">Good morning, Ms. Priya. You have <span className="text-emerald-600 font-bold">6 classes</span> scheduled today.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Clock className="h-3 w-3" /> Term 2 • Week 12
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-emerald-100 rounded-3xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-emerald-50 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 font-bold text-lg">Today's Schedule</CardTitle>
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-widest">View Full Calendar</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-emerald-50">
              {[
                { subject: 'Mathematics', class: 'Grade 10-A', time: '09:00 - 09:45', status: 'completed' },
                { subject: 'Science', class: 'Grade 10-C', time: '10:00 - 10:45', status: 'current' },
                { subject: 'Physics', class: 'Grade 12-B', time: '11:15 - 12:00', status: 'pending' },
                { subject: 'Mathematics', class: 'Grade 11-A', time: '13:00 - 13:45', status: 'pending' },
              ].map((item, i) => (
                <div key={i} className={`p-5 flex items-center gap-4 transition-colors ${item.status === 'current' ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                  <div className={`h-2 w-2 rounded-full ${item.status === 'completed' ? 'bg-slate-300' : item.status === 'current' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-200'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.subject}</p>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{item.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">{item.time}</p>
                    {item.status === 'current' && <span className="text-[10px] text-emerald-600 font-black uppercase">Ongoing</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Tasks</h3>
            <div className="space-y-3">
              {[
                'Submit Grade 10-A marks report',
                'Approve leaf requests (3)',
                'Class teacher meeting @ 4PM',
                'Upload homework for Science'
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group cursor-pointer hover:bg-emerald-50 transition-colors">
                  <div className="h-5 w-5 rounded border border-slate-300 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                    <CheckCircle2 className="h-3 w-3 text-transparent group-hover:text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
