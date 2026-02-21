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
    { title: "Total Employees", value: String(summary.totalEmployees), icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { title: "Active Employees", value: String(summary.activeEmployees), icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { title: "Open Tasks", value: String(summary.openTasks), icon: ClipboardList, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { title: "Pending Payroll Runs", value: String(summary.pendingPayroll), icon: Banknote, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">HRMS Command Center</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage your workforce, payroll, and organization operations.</p>
        </div>
        <Button variant="outline" onClick={() => void loadDashboard(true)} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
             <RefreshCw className="h-6 w-6 animate-spin mb-4 text-primary" />
             Loading HRMS data...
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MODULES.map((mod) => (
          <Card key={mod.title} className="border-none shadow-sm group hover:shadow-md transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <mod.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{mod.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm font-medium text-muted-foreground">{mod.desc}</p>
              <Link href={mod.href} className="block">
                <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {mod.action} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Payroll Runs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground font-medium py-4 text-center bg-muted/30 rounded-lg">No payroll runs found.</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="text-sm font-semibold text-foreground">Run #{run.id.slice(0, 8)} <span className="text-muted-foreground font-medium ml-1">({run.month || "-"} / {run.year || "-"})</span></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted p-1.5 rounded-md">{asText(run.status) || "unknown"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Open Task Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground font-medium py-4 text-center bg-muted/30 rounded-lg">No staff tasks found.</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="text-sm font-semibold text-foreground truncate max-w-[200px]">{task.title || `Task #${task.id.slice(0, 8)}`}</div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted p-1.5 rounded-md">{asText(task.status) || "open"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
