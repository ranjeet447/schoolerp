import { 
  HeroSection, 
  FeatureTabs, // Replaced FeatureGrid
  RoadmapSection, 
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
      


      <FeatureTabs />
      <TestimonialSection />
      <FAQSection />
      <FinalCTA />
    </main>
  );
}
