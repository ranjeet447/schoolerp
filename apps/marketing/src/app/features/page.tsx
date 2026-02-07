import React from 'react';
import { 
  FeatureDeepDive, 
  HeroSection, 
  FinalCTA 
} from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features - School ERP',
  description: 'Explore the comprehensive suite of modules designed to automate your school.',
};

const MODULES = [
  {
    title: "Core Academic Cycle",
    description: "From admission inquiries to final report cards, manage the entire student lifecycle with gradebooks that adapt to your board (CBSE/ICSE/State).",
    badge: "Academics",
    benefits: ["Customizable gradebook schemas", "Teacher lesson planners", "Student portal for homework"],
    imageSide: "right" as const
  },
  {
    title: "Financial Precision",
    description: "Stop revenue leakage with automated fee reminders, online payments, and tight integration with Tally for accounting reconciliation.",
    badge: "Finance",
    benefits: ["Auto-reconciliation via PG integration", "Staff payroll managed in clicks", "Sequential receipting compliance"],
    imageSide: "left" as const
  },
  {
    title: "Logistics & Supply Chain",
    description: "Full visibility into school transport, library catalogs, and procurement workflows. Manage your physical assets as efficiently as your digital ones.",
    badge: "Operations",
    benefits: ["Live GPS tracking for transport", "ISBN-mapped library management", "Inventory & Fixed Asset tracking"],
    imageSide: "right" as const
  },
  {
    title: "Campus Safety & Security",
    description: "A comprehensive safety suite including visitor management, gate passes, and pickup authorization with QR-code verification.",
    badge: "Safety",
    benefits: ["Verified pickup authorizations", "Digital gate pass approvals", "Emergency broadcast alerts"],
    imageSide: "left" as const
  },
  {
    title: "HRMS & Automated Payroll",
    description: "Manage your most valuable asset—your staff. Automated biometric sync and compliance-grade payslip generation.",
    badge: "Staff",
    benefits: ["Biometric payroll integration", "Salary structure configurator", "Teacher performance tracking"],
    imageSide: "right" as const
  },
  {
    title: "Multi-School Portfolio",
    description: "Designed for school groups. Monitor academic and financial health across all campuses from a single group dashboard.",
    badge: "Groups",
    benefits: ["Cross-campus analytics", "Group-level financial rollup", "Unified management cockpit"],
    imageSide: "left" as const
  },
  {
    title: "Alumni & Placement Portal",
    description: "Nurture your legacy. Stay connected with alumni and coordinate placement drives to help your graduates succeed.",
    badge: "Community",
    benefits: ["Verified alumni directory", "Placement drive automation", "Carrier success tracking"],
    imageSide: "right" as const
  },
  {
    title: "Automation Studio",
    description: "The future of school management. A no-code platform to build custom workflows, rules, and triggers that fit your school's unique culture.",
    badge: "Innovation",
    benefits: ["No-code workflow builder", "Custom logic & rule engine", "Time-based auto-triggers"],
    imageSide: "left" as const
  }
];

export default function FeaturesPage() {
  return (
    <main>
      <div className="pt-24 pb-12 text-center bg-muted/20">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Platform Capabilities</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Everything you need to run a modern educational institution.
        </p>
      </div>

      <div className="bg-background">
        {MODULES.map((mod, i) => (
          <FeatureDeepDive key={i} {...mod} />
        ))}
      </div>

      <FinalCTA />
    </main>
  );
}
