"use client"

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@schoolerp/ui"
import { CheckCircle2, Rocket, Zap, BookOpen, ShieldCheck } from "lucide-react"

const CHANGELOG = [
  {
    version: "1.0.0",
    date: "February 5, 2026",
    title: "Release 1: Foundation & Core Academic Cycle",
    description: "The official launch of our production-grade School ERP foundation. Everything you need to run your school's daily operations, from attendance to exams.",
    items: [
      { 
        category: "Academic", 
        title: "Exams & Report Cards", 
        description: "Bulk marks entry, automated pass/fail logic, and visual report card previews for parents.",
        icon: Rocket
      },
      { 
        category: "Finance", 
        title: "Fees & Sequential Receipting", 
        description: "Hardened financial module with strict numbering series, partial payments, and refund tracking.",
        icon: Zap
      },
      { 
        category: "Communication", 
        title: "Targeted Notices", 
        description: "Send circulars to specific classes or the entire school with acknowledgment tracking.",
        icon: BookOpen
      },
      { 
        category: "Operations", 
        title: "Attendance & Leaves", 
        description: "Daily marking with 48h locking policy and parent-driven leave requests.",
        icon: CheckCircle2
      },
      { 
        category: "Infra", 
        title: "System Hardening", 
        description: "Multi-tenant isolation, append-only audit logs, and conditional policy engine.",
        icon: ShieldCheck
      }
    ]
  }
]

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 py-12">
      <div className="space-y-4">
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 font-bold">
          Product Updates
        </Badge>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight">What's New</h1>
        <p className="text-xl text-gray-500 font-medium">
          Stay updated with the latest features and improvements to the school platform.
        </p>
      </div>

      <div className="space-y-20 relative">
        {/* Vertical Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-100 hidden md:block" />

        {CHANGELOG.map((release, releaseIdx) => (
          <div key={releaseIdx} className="relative pl-0 md:pl-16">
            {/* Version Badge on Line */}
            <div className="absolute left-0 top-1 w-[56px] h-[56px] rounded-full bg-white border-4 border-blue-600 shadow-lg hidden md:flex items-center justify-center z-10">
              <span className="text-xs font-black text-blue-600">v{release.version.split('.')[0]}</span>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600 font-bold">v{release.version}</Badge>
                  <span className="text-sm font-bold text-gray-400">{release.date}</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900">{release.title}</h2>
                <p className="text-gray-600 leading-relaxed text-lg max-w-2xl">
                  {release.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {release.items.map((item, itemIdx) => (
                  <Card key={itemIdx} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-blue-600">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-12 border-t text-center">
        <p className="text-sm text-gray-400 font-medium">
          Have feedback or feature requests? Contact our support team.
        </p>
      </div>
    </div>
  )
}
