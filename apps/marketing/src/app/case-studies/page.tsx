import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Case Studies - School ERP',
  description: 'Read how schools across India are achieving operational excellence.',
};

const CASE_STUDIES = [
  {
    slug: 'demo-school-scale',
    title: 'How Demo School Scaled to 4000+ Students',
    school: 'Demo International, Delhi',
    impact: '85% Efficiency Gain',
    description: 'Manual fee collection was leading to 15% revenue leakage. Learn how our finance module transformed their operations.'
  },
  {
    slug: 'heritage-multi-branch',
    title: 'Unifying 12 Branches for The Heritage Group',
    school: 'Heritage Schools, Pan-India',
    impact: 'Centralized Control',
    description: 'Disconnected data across locations made auditing a nightmare. We provided a single source of truth.'
  },
  {
    slug: 'regional-success',
    title: 'Bridging the Language Gap in Rural Maharashtra',
    school: 'Saraswati Vidya Mandir',
    impact: '100% Staff Adoption',
    description: 'Staff were uncomfortable with English-only UI. Our Marathi localization enabled full digital transformation.'
  }
];

export default function CaseStudiesPage() {
  return (
    <main>
      <div className="pt-24 pb-12 bg-muted/20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Success Stories</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Real results from real institutions.
        </p>
      </div>

      <Section>
        <Container>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {CASE_STUDIES.map((study) => (
              <Link 
                key={study.slug} 
                href={`/case-studies/${study.slug}`}
                className="group flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="text-sm font-bold uppercase tracking-wider">{study.impact}</span>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-foreground leading-tight">
                  {study.title}
                </h3>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {study.school}
                </p>
                <p className="mt-6 flex-1 text-muted-foreground line-clamp-3">
                  {study.description}
                </p>
                <div className="mt-8 flex items-center gap-2 font-bold text-foreground group-hover:text-primary transition-colors">
                  Read Case Study <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
