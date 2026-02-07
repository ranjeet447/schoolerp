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

        <div className="relative space-y-24">
          {PHASES.map((phase, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring" }}
              className={cn(
                "flex flex-col lg:flex-row items-center gap-12",
                idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              )}
            >
              <div className="flex-1 w-full">
                <div className={cn(
                  "relative group rounded-[2.5rem] border p-10 bg-card/30 backdrop-blur-sm transition-all hover:shadow-2xl hover:border-primary/20",
                  phase.active ? "border-primary/30" : "border-muted"
                )}>
                  {/* Phase Label */}
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6",
                    phase.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                    phase.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-purple-500/10 text-purple-500"
                  )}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", phase.active ? "animate-pulse bg-current" : "bg-current")} />
                    {phase.status}
                  </div>

                  <h3 className="text-3xl font-bold tracking-tight mb-4">{phase.title}</h3>
                  <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                    {phase.description}
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {phase.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className={cn(
                          "h-5 w-5 mt-0.5 shrink-0 opacity-20",
                          phase.color === 'blue' ? "text-blue-500" :
                          phase.color === 'emerald' ? "text-emerald-500" :
                          "text-purple-500"
                        )} />
                        <span className="text-sm font-bold text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Icon Badge */}
                  <div className={cn(
                    "absolute -top-6 -right-6 h-16 w-16 rounded-2xl shadow-xl flex items-center justify-center border-4 border-background transition-transform group-hover:rotate-12",
                    phase.color === 'blue' ? "bg-blue-500 text-white" :
                    phase.color === 'emerald' ? "bg-emerald-500 text-white" :
                    "bg-purple-500 text-white"
                  )}>
                    <phase.icon className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Center Dot for Desktop */}
              <div className="relative hidden lg:flex h-12 w-12 items-center justify-center shrink-0 z-20">
                <div className={cn(
                  "h-5 w-5 rounded-full border-4 border-background ring-4 ring-muted",
                  phase.active ? "bg-primary animate-ping-slow" : "bg-muted-foreground/30"
                )} />
              </div>

              <div className="flex-1 hidden lg:block" />
            </motion.div>
          ))}
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
