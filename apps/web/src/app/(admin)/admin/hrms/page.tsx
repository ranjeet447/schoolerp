"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@schoolerp/ui";
import { Users, Banknote, ClipboardList, Activity, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Employee = { id: string; status?: string };
type SalaryStructure = { id: string };
type PayrollRun = { id: string; status?: string; month?: number; year?: number };
type StaffTask = { id: string; status?: string; title?: string; priority?: string };

const MODULES = [
  {
    title: "Employee Directory",
    desc: "Manage staff profiles, contracts, and onboarding records.",
    icon: Users,
    href: "/admin/hrms/employees",
    action: "Open Directory",
  },
  {
    title: "Payroll Management",
    desc: "Run payroll cycles and monitor execution states.",
    icon: Banknote,
    href: "/admin/hrms/payroll",
    action: "Open Payroll",
  },
  {
    title: "Task Operations",
    desc: "Track staff tasks and assignment workload.",
    icon: ClipboardList,
    href: "/admin/hrms/tasks",
    action: "Open Tasks",
  },
];

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: unknown }).String;
    return typeof v === "string" ? v : "";
  }
  return "";
}

export default function HRMSDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const [employeesRes, salaryRes, payrollRes, tasksRes] = await Promise.all([
        apiClient("/admin/hrms/employees?limit=200"),
        apiClient("/admin/hrms/salary-structures"),
        apiClient("/admin/hrms/payroll-runs?limit=200"),
        apiClient("/admin/hrms/staff/tasks"),
      ]);

      setEmployees(employeesRes.ok ? asArray<Employee>(await employeesRes.json()) : []);
      setSalaryStructures(salaryRes.ok ? asArray<SalaryStructure>(await salaryRes.json()) : []);
      setPayrollRuns(payrollRes.ok ? asArray<PayrollRun>(await payrollRes.json()) : []);
      setTasks(tasksRes.ok ? asArray<StaffTask>(await tasksRes.json()) : []);
    } catch {
      toast.error("Failed to load HRMS dashboard.");
      setEmployees([]);
      setSalaryStructures([]);
      setPayrollRuns([]);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard(false);
  }, []);

  const summary = useMemo(() => {
    const activeEmployees = employees.filter((e) => asText(e.status).toLowerCase() === "active").length;
    const pendingPayroll = payrollRuns.filter((r) => !["completed", "paid"].includes(asText(r.status).toLowerCase())).length;
    const openTasks = tasks.filter((t) => !["completed", "closed"].includes(asText(t.status).toLowerCase())).length;
    return {
      totalEmployees: employees.length,
      activeEmployees,
      salaryStructures: salaryStructures.length,
      pendingPayroll,
      openTasks,
    };
  }, [employees, payrollRuns, salaryStructures.length, tasks]);

  const recentRuns = useMemo(() => payrollRuns.slice(0, 5), [payrollRuns]);
  const recentTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  const stats = [
    { title: "Total Employees", value: String(summary.totalEmployees), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Active Employees", value: String(summary.activeEmployees), icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { title: "Open Tasks", value: String(summary.openTasks), icon: ClipboardList, color: "text-amber-400", bg: "bg-amber-500/10" },
    { title: "Pending Payroll Runs", value: String(summary.pendingPayroll), icon: Banknote, color: "text-rose-400", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">HRMS Command Center</h1>
          <p className="text-slate-400 font-medium">Manage your workforce, payroll, and organization operations.</p>
        </div>
        <Button variant="outline" className="border-white/10 bg-slate-900/50" onClick={() => void loadDashboard(true)} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-8 text-center text-slate-400">Loading HRMS data...</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-slate-900/50 border-white/5 hover:bg-slate-900/80 transition-colors">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MODULES.map((mod) => (
          <Card key={mod.title} className="bg-slate-900/50 border-white/5 group hover:border-indigo-500/30 transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <mod.icon className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-xl">{mod.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-400">{mod.desc}</p>
              <Link href={mod.href} className="block">
                <Button className="w-full bg-slate-800 hover:bg-indigo-600 border border-white/5 hover:border-indigo-500/50 transition-all">
                  {mod.action} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-white/5">
          <CardHeader>
            <CardTitle>Recent Payroll Runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRuns.length === 0 ? (
              <p className="text-sm text-slate-500">No payroll runs found.</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-lg border border-white/5 p-3">
                  <div className="text-sm text-slate-200">Run #{run.id.slice(0, 8)} ({run.month || "-"} / {run.year || "-"})</div>
                  <span className="text-xs uppercase text-slate-400">{asText(run.status) || "unknown"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/5">
          <CardHeader>
            <CardTitle>Open Task Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-slate-500">No staff tasks found.</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border border-white/5 p-3">
                  <div className="text-sm text-slate-200 truncate">{task.title || `Task #${task.id.slice(0, 8)}`}</div>
                  <span className="text-xs uppercase text-slate-400">{asText(task.status) || "open"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
