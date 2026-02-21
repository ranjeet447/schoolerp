"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import {
  Clock, Users, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Coffee, Briefcase, Download,
} from "lucide-react";

interface StaffEntry {
  employee_id: string;
  employee_name: string;
  department: string;
  status: string;
  check_in_time: string;
  check_out_time: string;
  remarks: string;
}

interface StaffSession {
  id: string;
  date: string;
  entries: StaffEntry[];
}

interface StaffStats {
  date: string;
  total_staff: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  on_leave: number;
  attendance_pct: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; class: string; bg: string }> = {
  present: { label: "Present", icon: CheckCircle2, class: "text-emerald-400", bg: "bg-emerald-500/10" },
  absent: { label: "Absent", icon: XCircle, class: "text-red-400", bg: "bg-red-500/10" },
  late: { label: "Late", icon: AlertCircle, class: "text-amber-400", bg: "bg-amber-500/10" },
  half_day: { label: "Half Day", icon: Coffee, class: "text-orange-400", bg: "bg-orange-500/10" },
  on_leave: { label: "On Leave", icon: Briefcase, class: "text-blue-400", bg: "bg-blue-500/10" },
};

export default function StaffAttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [session, setSession] = useState<StaffSession | null>(null);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; department: string }[]>([]);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, statsRes, empRes] = await Promise.all([
        apiClient(`/admin/staff-attendance?date=${date}`),
        apiClient(`/admin/staff-attendance/stats?date=${date}`),
        apiClient("/admin/hrms/employees?limit=200"),
      ]);

      const statsData = statsRes.ok ? await statsRes.json() : null;
      setStats(statsData);

      const sessData = sessRes.ok ? await sessRes.json() : null;
      setSession(sessData);

      const empData = empRes.ok ? await empRes.json() : [];
      const empList = Array.isArray(empData) ? empData : empData?.data || [];
      setEmployees(empList);

      // Pre-fill entries
      const map: Record<string, string> = {};
      empList.forEach((emp: { id: string }) => { map[emp.id] = "present"; });
      if (sessData?.entries) {
        sessData.entries.forEach((e: StaffEntry) => { map[e.employee_id] = e.status; });
      }
      setEntries(map);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [date]);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleMark = async () => {
    setSaving(true);
    try {
      const body = {
        date,
        entries: Object.entries(entries).map(([employee_id, status]) => ({
          employee_id, status,
        })),
      };
      await apiClient("/admin/staff-attendance", { method: "POST", body: JSON.stringify(body) });
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const setAllStatus = (status: string) => {
    const map: Record<string, string> = {};
    employees.forEach(emp => { map[emp.id] = status; });
    setEntries(map);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Staff Attendance</h1>
          <p className="text-muted-foreground font-medium">Mark and track daily attendance for all staff members.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => changeDate(-1)} variant="ghost" className="text-muted-foreground hover:text-foreground rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5">
            <Calendar className="h-4 w-4 text-primary" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-transparent text-foreground font-bold border-none outline-none" />
          </div>
          <Button onClick={() => changeDate(1)} variant="ghost" className="text-muted-foreground hover:text-foreground rounded-xl">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: "Total Staff", value: stats.total_staff, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { label: "Present", value: stats.present, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Absent", value: stats.absent, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
            { label: "Late", value: stats.late, icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Half Day", value: stats.half_day, icon: Coffee, color: "text-orange-400", bg: "bg-orange-500/10" },
            { label: "On Leave", value: stats.on_leave, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/50 shadow-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-8 w-8 ${s.bg} rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground">{s.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-bold text-muted-foreground">Mark All:</span>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setAllStatus(key)}
            className={`${cfg.bg} ${cfg.class} px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity`}>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="bg-card border border-border/50 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Attendance Sheet</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground rounded-xl text-sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button onClick={handleMark} disabled={saving || employees.length === 0}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl px-6">
              {saving ? "Saving…" : session ? "Update Attendance" : "Save Attendance"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-bold">No employees found</p>
            <p className="text-sm text-muted-foreground">Add employees in HRMS to mark attendance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</th>
                  <th className="text-center px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {employees.map(emp => {
                  const status = entries[emp.id] || "present";
                  return (
                    <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-foreground font-bold">{emp.full_name}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-muted-foreground">{emp.department || "—"}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                              <button key={key} onClick={() => setEntries(prev => ({ ...prev, [emp.id]: key }))}
                                className={`p-2 rounded-lg transition-all ${status === key
                                  ? `${cfg.bg} ${cfg.class} ring-1 ring-current`
                                  : "text-muted-foreground hover:bg-muted/50"
                                }`} title={cfg.label}>
                                <Icon className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
