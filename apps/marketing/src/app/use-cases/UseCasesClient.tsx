"use client";

import React from "react";
import { UseCaseGrid, Container, Section } from "@schoolerp/ui";
import { motion } from "framer-motion";

const USE_CASES = [
  { slug: "principal-ops", title: "Principals & Management", description: "Centralized governance, policy enforcement, and multi-branch intelligence.", icon: "Building", stats: "Full visibility", category: "Principal" },
  { slug: "accounting-ledger", title: "Accountants & Finance", description: "Audit-grade receipts, settlement tracking, and automated Tally Prime exports.", icon: "Wallet", stats: "98% on-time fees", category: "Accountant" },
  { slug: "teacher-workload", title: "Teachers & Coordinators", description: "Effortless attendance, homework sharing, lesson planning, and marks entry.", icon: "GraduationCap", stats: "Save 10hrs/week", category: "Teacher" },
  { slug: "parent-engagement", title: "Parents & Students", description: "Real-time results, fee tracking, automated notices, and transport alerts.", icon: "Users", stats: "90% adoption", category: "Parent" },
  { slug: "safety-operations", title: "Operations & Safety", description: "Visitor gate-pass, real-time transport tracking, and automated emergency alerts.", icon: "Shield", stats: "Instant alerts", category: "Operations" },
  { slug: "small-private-school", title: "Small Private Schools", description: "Affordable, all-in-one management for growing institutions.", icon: "Building", stats: "Save 20hrs/week", category: "Principal" },
  { slug: "multi-branch-group", title: "Multi-branch Institutions", description: "Centralized control and consolidated reporting for school chains.", icon: "Globe", stats: "Unified Dashboard", category: "Management" },
  { slug: "regional-language", title: "Vernacular Medium Schools", description: "Complete ERP interface available in Hindi, Marathi, and Tamil.", icon: "Users", stats: "10+ Languages", category: "Teacher" },
];

export function UseCasesClient() {
  const [segment, setSegment] = React.useState<string>("All");
  const filtered = React.useMemo(
    () => segment === "All" ? USE_CASES : USE_CASES.filter(c => c.category === segment),
    [segment]
  );

  return (
    <div className="bg-background">
      <Section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        
        <Container className="relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-8 backdrop-blur-xl">
              Specialized Solutions
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95] mb-8">
              Engineered for every <br />
              <span className="text-primary italic">educational footprint</span>.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/80 font-medium leading-relaxed max-w-2xl mx-auto mb-12">
              From principals to transport managers, see how each team wins with SchoolERP’s precision-built modules.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2">
              {["All","Principal","Accountant","Teacher","Parent","Operations","Management"].map((seg) => (
                <button
                  key={seg}
                  onClick={() => setSegment(seg)}
                  className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    segment === seg 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>

      <UseCaseGrid cases={filtered} />
    </div>
  );
}
