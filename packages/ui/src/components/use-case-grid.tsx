import React from 'react';
import { Container, Section } from './layout-foundation';
import { ArrowRight, Building, Users, Globe, GraduationCap, Wallet, Shield } from 'lucide-react';
import Link from 'next/link';

export type UseCaseItem = {
  slug: string;
  title: string;
  description: string;
  icon: any;
  stats: string;
  category?: string;
};

const DEFAULT_USE_CASES: UseCaseItem[] = [
  {
    slug: 'small-private-school',
    title: 'Small Private Schools',
    description: 'Affordable, all-in-one management for schools with < 500 students.',
    icon: Building,
    stats: 'Save 20hrs/week',
    category: 'Principal'
  },
  {
    slug: 'multi-branch-group',
    title: 'Multi-branch Institutions',
    description: 'Centralized control and consolidated reporting for school chains.',
    icon: Globe,
    stats: 'Unified Dashboard',
    category: 'Management'
  },
  {
    slug: 'regional-language',
    title: 'Vernacular Medium Schools',
    description: 'Complete ERP interface available in Hindi, Marathi, and Tamil.',
    icon: Users,
    stats: '10+ Languages',
    category: 'Teacher'
  },
  {
    slug: 'accounting-ledger',
    title: 'Accountants & Finance Teams',
    description: 'Compliance-grade receipts, settlement tracking, and ledger exports to Tally.',
    icon: Wallet,
    stats: '98% on-time fees',
    category: 'Accountant'
  },
  {
    slug: 'safety-operations',
    title: 'Operations & Safety',
    description: 'Visitor gate-pass, transport tracking, and automated alerts for incidents.',
    icon: Shield,
    stats: 'Instant alerts',
    category: 'Operations'
  },
  {
    slug: 'teacher-workload',
    title: 'Teachers & Coordinators',
    description: 'Attendance, homework, lesson planning, and marks entry in one place.',
    icon: GraduationCap,
    stats: 'Reduce paperwork',
    category: 'Teacher'
  }
];

export const UseCaseGrid = ({ cases = DEFAULT_USE_CASES }: { cases?: UseCaseItem[] }) => {
  return (
    <Section className="bg-background">
      <Container>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for every type of campus
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Whether you are a single branch or a nationwide chain, we scale with you.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {cases.map((useCase) => (
            <Link 
              key={useCase.slug} 
              href={`/use-cases/${useCase.slug}`}
              className="group relative flex flex-col rounded-2xl border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/50"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <useCase.icon className="h-6 w-6" />
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-foreground">
                  {useCase.title}
                </h3>
                {useCase.category && (
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {useCase.category}
                  </span>
                )}
              </div>
              
              <p className="mt-4 flex-1 text-muted-foreground">
                {useCase.description}
              </p>
              
              <div className="mt-8 flex items-center justify-between border-t pt-4 text-sm font-medium">
                <span className="text-primary">{useCase.stats}</span>
                <div className="flex items-center gap-1 text-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
                  See Case Study <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
};
