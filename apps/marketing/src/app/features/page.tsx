import React from 'react';
import { 
  FeatureDeepDive, 
  FinalCTA,
  Container,
  Section,
} from '@schoolerp/ui';
import { Metadata } from 'next';
import { FEATURES_DATA } from '@schoolerp/ui';

export const metadata: Metadata = {
  title: 'Features - School ERP',
  description: 'Explore the comprehensive suite of modules designed to automate your school.',
};

export default function FeaturesPage() {
  return (
    <main>
      <Section className="bg-gradient-to-b from-muted/40 to-background pt-32 pb-16">
        <Container className="space-y-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Product Overview</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">All the rails your school needs.</h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            One operating system for academics, finance, safety, operations, communication, and automation. 
            Every module is ready for your rollout.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {[
              { label: 'Academics', value: 'SIS • Exams • Homework' },
              { label: 'Finance', value: 'Receipts • Tally-ready exports • Reconciliation' },
              { label: 'Safety & Ops', value: 'Transport • Visitor gate-pass • Alerts' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-card/60 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{item.label}</p>
                <p className="mt-2 text-sm text-foreground/80">{item.value}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <div className="bg-background">
        {FEATURES_DATA.map((feature, i) => (
          <FeatureDeepDive 
            key={feature.id} 
            title={feature.title}
            description={feature.longDescription}
            badge={feature.category.toUpperCase()}
            benefits={feature.benefits}
            imageSide={i % 2 === 0 ? 'right' : 'left'}
          />
        ))}
      </div>

      <FinalCTA />
    </main>
  );
}
