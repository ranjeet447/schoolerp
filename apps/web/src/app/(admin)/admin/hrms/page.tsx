"use client"

import { Card, CardContent, CardHeader, CardTitle, Button } from "@schoolerp/ui"
import { Users, Banknote, CalendarDays, Activity, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HRMSDashboard() {
  const stats = [
    { title: "Total Employees", value: "142", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "On Leave Today", value: "8", icon: CalendarDays, color: "text-amber-400", bg: "bg-amber-500/10" },
    { title: "Pending Payroll", value: "₹ 4.2L", icon: Banknote, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { title: "Open Positions", value: "3", icon: Activity, color: "text-rose-400", bg: "bg-rose-500/10" },
  ]

  const modules = [
    { 
      title: "Employee Directory", 
      desc: "Manage staff profiles, contracts, and documents.",
      icon: Users,
      href: "/admin/hrms/employees",
      action: "View Directory"
    },
    { 
      title: "Payroll Management", 
      desc: "Process salaries, generate slips, and manage bonuses.",
      icon: Banknote,
      href: "/admin/hrms/payroll",
      action: "Run Payroll"
    },
    { 
      title: "Leave & Attendance", 
      desc: "Approve leave requests and track daily attendance.",
      icon: CalendarDays,
      href: "/admin/hrms/leaves", // Placeholder for now
      action: "Manage Leaves" 
    }
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">HRMS Command Center</h1>
        <p className="text-slate-400 font-medium">Manage your workforce, payroll, and organization culture.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="bg-slate-900/50 border-white/5 hover:bg-slate-900/80 transition-colors">
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

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((mod, idx) => (
          <Card key={idx} className="bg-slate-900/50 border-white/5 group hover:border-indigo-500/30 transition-all">
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
    </div>
  )
}
