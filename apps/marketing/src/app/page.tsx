import { 
  HeroSection, 
  FeatureGrid, 
  FeatureCarousel,
  FEATURES_DATA,
  TestimonialSection, 
  FAQSection, 
  FinalCTA 
} from '@schoolerp/ui';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School ERP - The Operating System for Modern Education',
  description: 'A comprehensive, audit-grade platform for Academics, Finance, and Campus Safety. Built for trust and scale.',
};

export default function MarketingHomePage() {
  return (
    <main className="flex min-h-screen flex-col gap-24">
      <HeroSection />
      
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Feature Highlights</h2>
          <p className="text-lg text-muted-foreground">Swipe to explore the core modules of our platform.</p>
        </div>
        <FeatureCarousel slides={FEATURES_DATA} />
      </div>

      <FeatureGrid />
      <TestimonialSection />
      <FAQSection />
      <FinalCTA />
    </main>
  );
}
