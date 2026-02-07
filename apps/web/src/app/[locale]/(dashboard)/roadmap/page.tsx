"use client"

import { Badge } from "@schoolerp/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@schoolerp/ui"
import { CheckCircle2, Circle, Clock, Map, Sparkles, Globe, Smartphone, Truck, ShoppingCart, Users } from "lucide-react"
import { cn } from "@schoolerp/ui"

const ROADMAP = [
  {
    status: "Released",
    title: "Release 1: Core Foundation",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    borderColor: "border-green-100",
    features: [
      { name: "Student Information System", icon: Users },
      { name: "Attendance & Leave Management", icon: Clock },
      { name: "Fees & Automated Receipting", icon: Sparkles },
      { name: "Exams & Digital Report Cards", icon: Map },
      { name: "Circulars & Acknowledgements", icon: CheckCircle2 }
    ]
  },
  {
    status: "Released",
    title: "Release 2: Advanced Logistics",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    borderColor: "border-green-100",
    features: [
      { name: "Transport & Live GPS Tracking", icon: Truck },
      { name: "Library & Digital Media Center", icon: BookOpen },
      { name: "Inventory & Procurement", icon: ShoppingCart },
      { name: "Online Admission Portal", icon: Globe }
    ]
  },
  {
    status: "Released",
    title: "Release 3: Ecosystem Expansion",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    borderColor: "border-green-100",
    features: [
      { name: "Mobile App (iOS & Android)", icon: Smartphone, pending: true },
      { name: "HRMS & Automated Payroll", icon: Users },
      { name: "Portfolio Dashboards for Groups", icon: Sparkles },
      { name: "Alumni & Placement Portal", icon: Globe }
    ]
  }
]

// Stub for BookOpen since it was missing in the list but used
import { BookOpen } from "lucide-react"

export default function RoadmapPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 py-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 px-3 py-1 font-bold italic">
          Future Vision
        </Badge>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight">Product Roadmap</h1>
        <p className="text-xl text-gray-500 font-medium">
          Our mission is to build the most comprehensive Operating System for schools. 
          Here's where we are and where we're headed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ROADMAP.map((phase, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-lg", phase.bg)}>
                <phase.icon className={cn("w-5 h-5", phase.color)} />
              </div>
              <span className={cn("text-xs font-black uppercase tracking-widest", phase.color)}>
                {phase.status}
              </span>
            </div>
            
            <Card className={cn("h-full border-2", phase.borderColor)}>
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl font-black text-gray-900 leading-tight">
                  {phase.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <ul className="space-y-4">
                  {phase.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div className="py-2">
                        <p className="font-bold text-gray-900 text-sm leading-tight">
                          {feature.name}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-[2rem] p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Sparkles size={160} />
        </div>
        <div className="relative z-10 space-y-6 max-w-xl mx-auto">
          <h2 className="text-3xl font-black">Want to shape our roadmap?</h2>
          <p className="text-gray-400 font-medium leading-relaxed">
            We build for schools. If you have a specific requirement that's not on the list, 
            we'd love to hear from you.
          </p>
          <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-black hover:bg-gray-100 transition-colors">
            Request a Feature
          </button>
        </div>
      </div>
    </div>
  )
}
