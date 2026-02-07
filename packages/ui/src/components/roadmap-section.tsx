"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Sparkles, Truck, ArrowRight, BrainCircuit, Cpu } from 'lucide-react';
import { Container, Section } from './layout-foundation';
import { cn } from '../lib/utils';

type PhaseStatus = "Released" | "In Progress" | "Planned";

interface Phase {
  status: PhaseStatus;
  title: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  color: "blue" | "emerald" | "purple" | "orange";
  active: boolean;
}

const PHASES: Phase[] = [
  {
    status: "Released",
    title: "Phase 1: Academic & Financial Core",
    description: "SIS, attendance, leaves, fee receipts, exams, report cards, multilingual UI.",
    features: [
      "Student Information System (SIS)",
      "Daily Attendance & Leave Management",
      "Compliance-grade Fee Receipting",
      "Examination & Report Card Engine",
      "Multilingual UI (Hindi, English, etc.)"
    ],
    icon: CheckCircle2,
    color: "blue",
    active: true,
  },
  {
    status: "Released",
    title: "Phase 2: Logistics & Operations",
    description: "Transport, inventory, library, admissions portal, procurement, assets.",
    features: [
      "Live GPS Transport & Routes",
      "Digital Media Center & Library",
      "Inventory & Procurement POs",
      "Public Admission Portals",
      "Asset & Maintenance Tracking"
    ],
    icon: Truck,
    color: "emerald",
    active: true,
  },
  {
    status: "In Progress",
    title: "Phase 3: Automation & Optimization",
    description: "Smart workflows, automated scheduling, and advanced analytics.",
    features: [
      "Automated Timetable Generation (Constraint-based)",
      "HRMS & Automated Payroll",
      "Portfolio Dashboards for Groups",
      "Alumni & Placement Portal",
      "Native Parent App (Prerelease)"
    ],
    icon: Sparkles,
    color: "purple",
    active: true,
  }
];

const PRACTICAL_AI_FEATURES = [
  {
    title: "Smart Notices & Reminders",
    desc: "Template-based fee reminders & circulars in Hindi/English.",
    icon: "📢"
  },
  {
    title: "Helpdesk Auto-Triage",
    desc: "Auto-tag parent requests: Fees, Transport, TC, etc.",
    icon: "🏷️"
  },
  {
    title: "At-Risk Student Flags",
    desc: "Rules-first signals from attendance/grades/fees => early alerts.",
    icon: "🚩"
  },
  {
    title: "Policy Search Copilot",
    desc: "Instant answers from school policies & calendar (retrieval-first).",
    icon: "🔍"
  },
  {
    title: "PTM Summary & Action Items",
    desc: "Convert quick notes into clean parent summaries.",
    icon: "📝"
  }
];

const AI_PLUGINS = [
  {
    title: "Voice-to-Text Remarks",
    desc: "Batch mode + caching; multi-language teacher remarks.",
    icon: "🎙️"
  },
  {
    title: "Question Bank Assistant",
    desc: "Generate papers from approved question bank + blueprint.",
    icon: "📚"
  },
  {
    title: "Advanced Forecasting",
    desc: "Branch/cohort trends & explainable financial projections.",
    icon: "📊"
  }
];

export const RoadmapSection = () => {
  return (
    <Section className="bg-background relative overflow-hidden">
      {/* Decorative center line for desktop */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-muted to-transparent hidden lg:block" />

      <Container>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center mb-24"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Our vision for the <span className="text-primary">future</span> of education.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            A roadmap built on trust, scale, and the relentless pursuit of excellence.
          </p>
        </motion.div>

        <div className="relative space-y-12 after:absolute after:inset-y-0 after:left-9 after:w-px after:bg-muted-foreground/20 after:-z-10 mt-16">
          {PHASES.map((phase, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative pl-24 md:pl-32"
            >
              {/* Timeline Dot */}
              <div className={cn(
                "absolute left-6 top-8 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center z-10",
                phase.active ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground"
              )}>
                {phase.active && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
              </div>

              <div className={cn(
                "group relative rounded-3xl border bg-card p-8 hover:shadow-lg transition-all",
                phase.active ? "border-primary/50 shadow-md" : "border-muted"
              )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className={cn(
                        "text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded",
                        phase.color === 'blue' ? "bg-blue-100 text-blue-700" :
                        phase.color === 'emerald' ? "bg-emerald-100 text-emerald-700" :
                        phase.color === 'purple' ? "bg-purple-100 text-purple-700" :
                        "bg-orange-100 text-orange-700"
                      )}>
                        {phase.status}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{phase.title}</h3>
                  </div>
                  <phase.icon className={cn(
                    "h-10 w-10 opacity-20",
                    phase.color === 'blue' ? "text-blue-500" :
                    phase.color === 'emerald' ? "text-emerald-500" :
                    phase.color === 'purple' ? "text-purple-500" :
                    "text-orange-500"
                  )} />
                </div>
                
                <p className="text-muted-foreground mb-6">{phase.description}</p>
                
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phase.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Practical AI Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              <BrainCircuit className="h-4 w-4" />
              Innovation
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl mb-6">
              Practical <span className="text-primary">AI</span> (Low-cost, High-value)
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We prioritize explainable, low-cost intelligence first. Heavier AI ships as opt-in plugins.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Low-cost AI Group */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">AI that Saves Time</h3>
                  <p className="text-sm text-muted-foreground">Low-cost, ships early, rules-first.</p>
                </div>
              </div>
              <div className="grid gap-4">
                {PRACTICAL_AI_FEATURES.map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ x: 4 }}
                    className="p-4 rounded-2xl border bg-card hover:border-primary/30 transition-all flex items-start gap-4"
                  >
                    <span className="text-2xl pt-1">{feature.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Plugins AI Group */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Optional AI Plugins</h3>
                  <p className="text-sm text-muted-foreground">Heavier compute, billed separately.</p>
                </div>
              </div>
              <div className="grid gap-4">
                {AI_PLUGINS.map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ x: 4 }}
                    className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-all flex items-start gap-4"
                  >
                    <span className="text-2xl pt-1">{feature.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded w-fit">
                        Opt-in Plugin
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <div className="inline-block px-6 py-2 rounded-full bg-muted/40 text-xs font-medium text-muted-foreground border border-white/5">
              💡 Note: We do not charge for base AI rules. You only pay for plugins that use 3rd-party APIs.
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 lg:p-20 rounded-[3rem] bg-primary text-primary-foreground text-center relative overflow-hidden"
        >
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-white/5 blur-3xl rounded-full" 
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold tracking-tight mb-6">Ready to scale with us?</h3>
            <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
              Join hundreds of schools transitioning to the modern standard. 
              Our deployment team will have you live in under 7 days.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button 
                onClick={() => window.location.href = '/book-demo'}
                className="bg-white text-primary px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2"
              >
                Start Your Journey
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
};
