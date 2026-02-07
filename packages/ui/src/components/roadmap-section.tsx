"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Sparkles, Truck, ArrowRight } from 'lucide-react';
import { Container, Section } from './layout-foundation';
import { cn } from '../lib/utils';

const PHASES = [
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
    status: "Released",
    title: "Phase 3: Ecosystem & Automation",
    description: "Automation Studio, moderated chat/PTM, portfolio analytics, native apps.",
    features: [
      "Portfolio Dashboards for Groups",
      "HRMS & Automated Payroll",
      "Alumni & Placement Portal",
      "Native Parent App (Prerelease)",
      "Automation Studio (Staging)"
    ],
    icon: Sparkles,
    color: "purple",
    active: true,
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
                        "bg-purple-100 text-purple-700"
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
                    "text-purple-500"
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

        {/* AI Features Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              Coming Soon
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl mb-6">
              The <span className="text-primary">AI</span> Frontier
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We are actively developing next-gen features powered by predictive intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Predictive Dropout Analysis",
                desc: "Identify students at risk of dropping out based on attendance and grade patterns before it happens.",
                icon: "📉"
              },
              {
                title: "Smart Fee Forecasting",
                desc: "AI-driven cash flow projections based on historical payment behaviors of parents.",
                icon: "💰"
              },
              {
                title: "Automated Timetable Gen",
                desc: "Constraint-based genetic algorithms to generate conflict-free schedules in seconds.",
                icon: "🗓️"
              },
              {
                title: "Voice-to-Text Remarks",
                desc: "Teachers can dictate student remarks and diary notes in 10+ Indian languages.",
                icon: "🎙️"
              },
              {
                title: "Exam Question Generator",
                desc: "Generate balanced question papers from the syllabus automatically.",
                icon: "📝"
              },
               {
                title: "Intelligent Chatbot",
                desc: "24/7 automated responses for common parent queries about fees, transport, and events.",
                icon: "🤖"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
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
