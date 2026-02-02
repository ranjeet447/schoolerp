import React from 'react';
import { DemoTypeCard } from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

const DEMO_TYPES = [
  { slug: 'quick-walkthrough', name: 'Quick Walkthrough', duration: 15, description: 'A fast 15-minute overview of core features.' },
  { slug: 'full-demo', name: 'Standard Product Demo', duration: 30, description: 'Comprehensive tour of Academic and Finance modules.' },
  { slug: 'deep-dive', name: 'Technical Deep Dive', duration: 60, description: 'In-depth discussion on security, integrations, and customization.' },
];

export default function BookDemoPage() {
  return (
    <div className="container py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold">Book a Live Demo</h1>
        <p className="mt-4 text-lg text-muted-foreground">Select the session that best fits your requirements.</p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {DEMO_TYPES.map(type => (
          <DemoTypeCard 
            key={type.slug} 
            {...type} 
            href={`/book-demo/${type.slug}`} 
          />
        ))}
      </div>
    </div>
  );
}
