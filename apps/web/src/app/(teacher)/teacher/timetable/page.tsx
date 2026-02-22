"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Printer, 
  Download,
  Clock,
  MapPin,
  BookOpen,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface TimetableSlot {
  id: string;
  day_of_week: number;
  period_name: string;
  start_time: string;
  end_time: string;
  subject: string;
  class_section: string;
  room: string;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TeacherTimetablePage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimetableSlot[]>([]);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/teacher/schedule/weekly');
      if (res.ok) {
        const data = await res.json();
        setEntries(data || []);
      }
    } catch (err) {
      toast.error("Failed to load weekly timetable");
    } finally {
      setLoading(false);
    }
  };

  // Group by period name/time to create rows
  const periods = useMemo(() => {
    const pMap = new Map<string, { start: string, end: string }>();
    entries.forEach(e => {
      pMap.set(e.period_name, { start: e.start_time, end: e.end_time });
    });
    
    // Sort periods by start time
    return Array.from(pMap.entries()).sort((a, b) => a[1].start.localeCompare(b[1].start));
  }, [entries]);

  const getEntry = (dayIdx: number, periodName: string) => {
    return entries.find(e => e.day_of_week === (dayIdx + 1) && e.period_name === periodName);
  };

  if (loading) {
     return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-slate-500 font-medium font-outfit">Constructing your academic grid...</p>
        </div>
     );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-0.5 font-black uppercase text-[10px] tracking-widest">Educator Portal</Badge>
          </div>
          <h1 className="text-4xl font-black text-slate-900 font-outfit">My Weekly Schedule</h1>
          <p className="text-slate-500 font-medium mt-1">Your comprehensive academic flow across all active sections.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="rounded-2xl border-emerald-100 hover:bg-emerald-50 gap-2 font-bold shadow-sm" onClick={fetchTimetable}>
             <RefreshCw className="h-4 w-4" /> Sync
          </Button>
          <Button variant="default" size="lg" className="rounded-2xl bg-slate-900 hover:bg-slate-800 gap-2 font-bold shadow-lg">
             <Printer className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Timetable Grid */}
      <Card className="border-emerald-100 rounded-[2.5rem] shadow-xl overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-6 text-left font-black uppercase tracking-widest text-[10px] border-b border-slate-800 w-40">Period</th>
                {WEEKDAYS.map(day => (
                  <th key={day} className="p-6 text-center font-black uppercase tracking-widest text-[10px] border-b border-slate-800 border-l border-slate-800">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(([pName, times], pIdx) => (
                <tr key={pName} className="group transition-colors hover:bg-emerald-50/30">
                  <td className="p-6 border-b border-emerald-50">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">{pName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                        <Clock className="h-3 w-3 inline mr-1" /> {times.start} - {times.end}
                      </span>
                    </div>
                  </td>
                  {WEEKDAYS.map((day, dIdx) => {
                    const entry = getEntry(dIdx, pName);
                    return (
                      <td key={day} className="p-3 border-b border-emerald-50 border-l border-emerald-50 h-32 align-top">
                        {entry ? (
                          <div className="h-full bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex flex-col justify-between group-hover:shadow-md transition-all relative overflow-hidden">
                            <div className="relative z-10">
                              <h4 className="text-xs font-black text-slate-900 line-clamp-1 mb-1">{entry.subject}</h4>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{entry.class_section}</p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 relative z-10">
                              <div className="h-5 w-5 rounded-lg bg-slate-50 flex items-center justify-center">
                                <MapPin className="h-3 w-3 text-slate-400" />
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Room {entry.room}</span>
                            </div>
                            {/* Decorative background circle */}
                            <div className="absolute -right-2 -bottom-2 h-12 w-12 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <BookOpen className="h-6 w-6 text-emerald-200" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-full rounded-2xl border-2 border-dashed border-slate-50 flex items-center justify-center opacity-30">
                            <span className="text-[9px] font-bold text-slate-300 uppercase">Free Slot</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                       <Calendar className="h-16 w-16 text-slate-300" />
                       <p className="text-slate-500 font-medium">No schedule data available for the active variant.</p>
                       <Button variant="outline" className="rounded-xl" onClick={() => window.history.back()}>Go Back</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bottom info */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
               <Info className="h-6 w-6 text-slate-900" />
            </div>
            <div>
               <p className="text-lg font-black font-outfit">Dynamic Relational Scheduling</p>
               <p className="text-sm text-slate-400 font-medium">This grid updates automatically when the administration changes seasonal variants.</p>
            </div>
         </div>
         <Button className="bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 px-8">
            View Substitution Logs
         </Button>
      </div>
    </div>
  );
}
