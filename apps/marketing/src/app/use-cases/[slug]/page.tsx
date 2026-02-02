import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Mock data generator for static params
export async function generateStaticParams() {
  return [
    { slug: 'small-private-school' },
    { slug: 'multi-branch-group' },
    { slug: 'regional-language' }
  ];
}

const DATA = {
  'small-private-school': {
    title: 'How Little Angels Academy Saved 20hrs/Week',
    category: 'Small Private Schools',
    stats: [
      { label: 'Time Saved', value: '20 Hrs/wk' },
      { label: 'Fee Collection', value: '+35%' },
      { label: 'Parent Satisfaction', value: '4.8/5' }
    ],
    challenges: [
      'Manual receipt generation taking days',
      'Lost student records in paper piles',
      'No way to communicate with parents efficiently'
    ],
    solutions: [
      'Automated digital receipts with WhatsApp integration',
      'Searchable student database',
      'One-click SMS broadcasts'
    ]
  },
  'multi-branch-group': {
    title: 'Unifying 12 Branches for K.V. Group',
    category: 'Multi-branch Institutions',
    stats: [
      { label: 'Branches', value: '12' },
      { label: 'Audit Time', value: '-80%' },
      { label: 'Revenue Leakage', value: '0%' }
    ],
    challenges: [
      'Disjointed data across locations',
      'Lack of central oversight',
      'Inconsistent fee policies'
    ],
    solutions: [
      'Centralized admin dashboard',
      'Standardized policy engine',
      'Real-time branch comparison reports'
    ]
  },
  'regional-language': {
    title: 'Bridging the Language Gap at Saraswati Vidya Mandir',
    category: 'Vernacular Medium',
    stats: [
      { label: 'Staff Adoption', value: '100%' },
      { label: 'Support Calls', value: '-60%' },
      { label: 'Languages', value: '3' }
    ],
    challenges: [
      'Staff uncomfortable with English-only UI',
      'Communication errors with parents',
      'Low software adoption'
    ],
    solutions: [
      'Full Hindi and Marathi UI localization',
      'Voice-based data entry features',
      'Multilingual report card generation'
    ]
  }
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = DATA[params.slug as keyof typeof DATA];
  return {
    title: data ? `${data.title} - Case Study` : 'Case Study',
  };
}

export default function UseCaseDetailPage({ params }: { params: { slug: string } }) {
  const data = DATA[params.slug as keyof typeof DATA];

  if (!data) return <div>Case study not found</div>;

  return (
    <main>
      <Section className="bg-muted/20">
        <Container>
          <Link href="/use-cases" className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to all stories
          </Link>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1">
              <span className="rounded-full border bg-background px-3 py-1 text-sm font-medium text-primary">
                {data.category}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                {data.title}
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-xl border bg-background p-6 lg:w-1/3">
              {data.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  <div className="mt-1 text-xl font-bold text-foreground">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 md:grid-cols-2">
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 dark:border-red-900/50 dark:bg-red-900/10">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">The Challenge</h2>
              <ul className="mt-6 space-y-4">
                {data.challenges.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="text-lg text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-8 dark:border-green-900/50 dark:bg-green-900/10">
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">The Solution</h2>
              <ul className="mt-6 space-y-4">
                {data.solutions.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-500" />
                    <span className="text-lg text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
