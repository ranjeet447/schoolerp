"use client";

import React from "react";
import { UseCaseGrid, Container, Section } from "@schoolerp/ui";
import { GraduationCap, Wallet, Shield, Users, Building2 } from "lucide-react";

const USE_CASES = [
  { slug: "principal-ops", title: "Principals & Management", description: "Dashboards, policies, and multi-branch governance.", icon: Building2, stats: "Full visibility", category: "Principal" },
  { slug: "accounting-ledger", title: "Accountants & Finance", description: "Receipts, settlements, Tally-ready exports, audits.", icon: Wallet, stats: "98% on-time fees", category: "Accountant" },
  { slug: "teacher-workload", title: "Teachers & Coordinators", description: "Attendance, homework, lesson planning, marks entry.", icon: GraduationCap, stats: "Reduce paperwork", category: "Teacher" },
  { slug: "parent-engagement", title: "Parents & Students", description: "Results, fees, notices, chat/PTM (planned), transport.", icon: Users, stats: "Delightful app", category: "Parent" },
  { slug: "safety-operations", title: "Operations & Safety", description: "Visitor gate-pass, transport, alerts, pickup auth.", icon: Shield, stats: "Instant alerts", category: "Operations" },
];

export function UseCasesClient() {
  const [segment, setSegment] = React.useState<string>("All");
  const filtered = React.useMemo(
    () => segment === "All" ? USE_CASES : USE_CASES.filter(c => c.category === segment),
    [segment]
  );

  return (
    <>
      <Section className="bg-gradient-to-b from-muted/40 to-background pt-24 pb-16">
        <Container className="text-center space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Who we serve</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From principals to transport managers, see how each team wins with School ERP—and what’s coming next.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["All","Principal","Accountant","Teacher","Parent","Operations"].map((seg) => (
              <button
                key={seg}
                onClick={() => setSegment(seg)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  segment === seg ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/40"
                }`}
              >
                {seg}
              </button>
            ))}
          </div>
        </Container>
      </Section>

      <UseCaseGrid cases={filtered} />
    </>
  );
}
