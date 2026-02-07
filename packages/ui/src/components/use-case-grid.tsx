"use client";

import React from 'react';
import { Container, Section } from './layout-foundation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { IconMapper } from './icon-mapper';

export type UseCaseItem = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  stats: string;
  category?: string;
};

const DEFAULT_USE_CASES: UseCaseItem[] = [
  {
    slug: 'small-private-school',
    title: 'Small Private Schools',
    description: 'Affordable, all-in-one management for schools with < 500 students.',
    icon: 'Building',
    stats: 'Save 20hrs/week',
    category: 'Principal'
  },
  {
    slug: 'multi-branch-group',
    title: 'Multi-branch Institutions',
    description: 'Centralized control and consolidated reporting for school chains.',
    icon: 'Globe',
    stats: 'Unified Dashboard',
    category: 'Management'
  },
  {
    slug: 'regional-language',
    title: 'Vernacular Medium Schools',
    description: 'Complete ERP interface available in Hindi, Marathi, and Tamil.',
    icon: 'Users',
    stats: '10+ Languages',
    category: 'Teacher'
  },
  {
    slug: 'accounting-ledger',
    title: 'Accountants & Finance Teams',
    description: 'Compliance-grade receipts, settlement tracking, and ledger exports to Tally.',
    icon: 'Wallet',
    stats: '98% on-time fees',
    category: 'Accountant'
  },
  {
    slug: 'safety-operations',
    title: 'Operations & Safety',
    description: 'Visitor gate-pass, transport tracking, and automated alerts for incidents.',
    icon: 'Shield',
    stats: 'Instant alerts',
    category: 'Operations'
  },
  {
    slug: 'teacher-workload',
    title: 'Teachers & Coordinators',
    description: 'Attendance, homework, lesson planning, and marks entry in one place.',
    icon: 'GraduationCap',
    stats: 'Reduce paperwork',
    category: 'Teacher'
  }
];

export const UseCaseGrid = ({ cases = DEFAULT_USE_CASES }: { cases?: UseCaseItem[] }) => {
  return (
    <Section className="bg-background relative">
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-fuchsia-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <Container>
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          <div className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4">
            Specialized Solutions
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl leading-[0.95]">
            Engineered for every <span className="italic">educational</span> frontier.
          </h2>
          <p className="mt-8 text-xl text-muted-foreground font-medium">
            Whether you are a local private school or a global multi-branch institution, SchoolERP adapts to your unique DNA.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((useCase) => (
            <Link 
              key={useCase.slug} 
              href={`/use-cases/${useCase.slug}`}
              className="group relative flex flex-col rounded-[2.5rem] border border-white/10 bg-card p-10 transition-all duration-500 hover:shadow-3xl hover:shadow-primary/20 hover:border-primary/40 hover:-translate-y-2 overflow-hidden"
            >
              {/* Corner Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] group-hover:bg-primary transition-colors duration-500 opacity-20 group-hover:opacity-10" />
              
              <div className="mb-10 inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-muted/30 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:rotate-6 group-hover:scale-110 shadow-inner">
                <IconMapper name={useCase.icon} size={32} />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {useCase.title}
                  </h3>
                </div>
                {useCase.category && (
                  <div className="inline-flex self-start rounded-full bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-primary mb-2 mt-1">
                    {useCase.category}
                  </div>
                )}
              </div>
              
              <p className="mt-6 flex-1 text-muted-foreground font-medium leading-relaxed">
                {useCase.description}
              </p>
              
              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs font-black uppercase tracking-widest">
                <span className="text-primary italic px-3 py-1 bg-primary/5 rounded-lg">{useCase.stats}</span>
                <div className="flex items-center gap-2 text-foreground group-hover:text-primary transition-all">
                  Case Study <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
};
