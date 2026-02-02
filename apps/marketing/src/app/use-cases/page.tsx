import React from 'react';
import { UseCaseGrid, HeroSection, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Use Cases - School ERP',
  description: 'See how schools like yours are succeeding with our platform.',
};

export default function UseCasesPage() {
  return (
    <main>
      <div className="pt-24 pb-12 bg-muted/20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Success Stories</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Real results from real institutions.
        </p>
      </div>

      <UseCaseGrid />
      <FinalCTA />
    </main>
  );
}
