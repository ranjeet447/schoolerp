"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { ChevronDown, GraduationCap, Bus, Shield, Users, Bell, FileText, Database, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

const MODULES = [
  {
    category: "Academics",
    icon: GraduationCap,
    features: [
      "Exam Presets & Custom Report Cards",
      "Dynamic Timetable Generator",
      "Library Book Issuance & Tracking",
      "Online Assignment Submission"
    ]
  },
  {
    category: "Operations",
    icon: Bus,
    features: [
      "Transport & GPS Routing App",
      "Hostel Room Allocations",
      "Asset & Inventory Management",
      "Visitor Gate Pass System"
    ]
  },
  {
    category: "Communication",
    icon: Bell,
    features: [
      "Knowledge Base / Help Center",
      "Notice Board & Alerts",
      "Event Calendar",
      "Alumni Network Portal"
    ]
  },
  {
    category: "HR & Identity",
    icon: Users,
    features: [
      "Staff Payroll & Salary Slips",
      "Biometric Attendance Integration",
      "Leave Request Workflows",
      "ID Card & Hall Ticket Generator"
    ]
  },
  {
    category: "Security & Admin",
    icon: Shield,
    features: [
      "Role-Based Access Control (RBAC)",
      "Automated Cloud Backups",
      "Audit Logs for Operations",
      "Multi-Campus Management"
    ]
  }
];

export const AlsoIncluded = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section className="bg-muted/30 py-24" id="all-modules">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-bold tracking-widest uppercase text-primary mb-3">Comprehensive Suite</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Also Included in Your ERP
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Everything you need to run operations smoothly, completely integrated from day one. Replace 10+ legacy tools.
          </p>
        </div>

        <div className="max-w-4xl mx-auto border rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm">
          {MODULES.map((mod, idx) => {
            const isOpen = openIndex === idx;
            const Icon = mod.icon;
            
            return (
              <div key={idx} className={cn("border-b border-border last:border-b-0", isOpen ? "bg-card" : "")}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 px-8 hover:bg-muted/30 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", isOpen ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border")}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">{mod.category}</span>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-8 pt-0 pl-[5.5rem] grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {mod.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                             <span className="text-muted-foreground font-medium">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
};
