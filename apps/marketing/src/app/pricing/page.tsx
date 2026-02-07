import React from 'react';
import { 
  PricingTable, 
  FAQSection,
  TestimonialSection,
  FinalCTA
} from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - School ERP',
  description: 'Transparent pricing for schools of all sizes. No hidden implementation fees.',
};

export default function PricingPage() {
  return (
    <main>
      <div className="pt-32 pb-12 text-center bg-muted/20">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Invest in Efficiency</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Our pricing scales with your student count. Start small, grow indefinitely.
        </p>
      </div>

      <PricingTable />
      
      <div className="py-12 bg-muted/10">
        <TestimonialSection />
      </div>

      <FAQSection />
      <FinalCTA />
    </main>
  );
}
