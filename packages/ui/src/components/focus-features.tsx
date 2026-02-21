"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { CheckCircle2, Banknote, MessageSquare, UserCheck, Users, Printer } from 'lucide-react';
import { cn } from '../lib/utils';

const FOCUS_FEATURES = [
  {
    title: "Smart Fee Counter & Dues",
    headline: "Collect fees faster with zero errors",
    description: "Lightning-fast split-pane checkout. Search students, view total dues across all heads, accept partial cash/UPI payments, and print receipts in 3 seconds.",
    bullets: [
      "Auto-calculate late fines based on your rules",
      "One-click waiver & concession requests",
      "Block exam hall tickets for defaulters instantly"
    ],
    icon: Banknote,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  },
  {
    title: "Instant Parent Communication",
    headline: "Keep parents in the loop effortlessly",
    description: "A digital alternative to physical diaries. Teachers can post daily homework with an optional 'Parent Acknowledgement Required' checkbox and log behavioral remarks.",
    bullets: [
      "Track which parents read/acknowledged circulars",
      "Send SMS/Push push notifications instantly",
      "Build a digital behavior & remark history"
    ],
    icon: MessageSquare,
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  {
    title: "Exception-Based Attendance",
    headline: "Mark attendance in 2 clicks",
    description: "'Mark All Present' by default—teachers only click to mark the 2-3 absent or late students. Free up 10 minutes of teaching time every single day.",
    bullets: [
      "1-click 'Send Notice' to parents of absentees",
      "Print late slips instantly from the front desk",
      "Staff & Student monthly registers auto-generated"
    ],
    icon: UserCheck,
    color: "text-orange-500",
    bg: "bg-orange-50"
  },
  {
    title: "Admissions Pipeline",
    headline: "Never miss a new admission",
    description: "Built-in follow-ups and complete document checklists. Track walk-ins, schedule interviews, and convert enquiries to admissions without re-typing data.",
    bullets: [
      "Track 'Next Follow-up Date' and outcomes",
      "Document checklist toggle for ID/TC verification",
      "1-click conversion to formal student record"
    ],
    icon: Users,
    color: "text-indigo-500",
    bg: "bg-indigo-50"
  },
  {
    title: "Office Reports Center",
    headline: "Inspection-ready registers instantly",
    description: "Generate inspection-ready registers and certificates with one click—no manual typing required. Pre-built templates for Indian school formats.",
    bullets: [
      "Export Admission & TC Registers to PDF/Excel",
      "Daily Fee Collection Day Book",
      "Certificate History log to prevent duplicates"
    ],
    icon: Printer,
    color: "text-purple-500",
    bg: "bg-purple-50"
  }
];

export const FocusFeatures = () => {
  return (
    <Section className="bg-background py-24 overflow-hidden" id="focus-features">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Everything you need. <br />
            <span className="text-primary italic">Nothing you don't.</span>
          </h2>
          <p className="text-xl text-muted-foreground font-medium">
            Designed specifically for the fast-paced reality of Indian schools. Stop fighting your software and start running your school.
          </p>
        </div>

        <div className="space-y-32">
          {FOCUS_FEATURES.map((feature, idx) => {
            const isEven = idx % 2 === 0;
            const Icon = feature.icon;
            
            return (
              <div key={idx} className={`flex flex-col gap-12 lg:gap-24 items-center ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                {/* Text Content */}
                <div className="flex-1 space-y-8">
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold tracking-widest uppercase border shadow-sm" style={{ backgroundColor: 'var(--background)' }}>
                    <Icon className={cn("w-4 h-4", feature.color)} />
                    <span className={feature.color}>{feature.title}</span>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                    {feature.headline}
                  </h3>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                    {feature.description}
                  </p>
                  
                  <div className="space-y-4 pt-2">
                    {feature.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-3">
                        <CheckCircle2 className={cn("w-5 h-5 shrink-0 mt-0.5", feature.color)} />
                        <span className="text-foreground font-semibold">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Abstract UI Visual */}
                <div className="flex-1 w-full">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7 }}
                    className={cn(
                      "relative aspect-[4/3] rounded-3xl border border-border shadow-2xl overflow-hidden overflow-hidden",
                      feature.bg
                    )}
                  >
                    {/* Minimalist wireframe representation of the UI */}
                    <div className="absolute top-0 left-0 right-0 h-10 border-b border-black/5 bg-white flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="pt-16 p-6 md:p-10 h-full flex flex-col gap-4">
                       <div className="w-1/3 h-6 rounded-md bg-black/10" />
                       <div className="w-full flex-1 rounded-xl bg-white shadow-sm border border-black/5 p-4 flex flex-col gap-3">
                         <div className="w-full h-8 rounded bg-black/5" />
                         <div className="w-3/4 h-8 rounded bg-black/5" />
                         <div className="w-1/2 h-8 rounded bg-black/5" />
                         <div className="w-full h-8 rounded bg-black/5" />
                       </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
};
