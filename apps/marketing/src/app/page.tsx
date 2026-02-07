import { 
  HeroSection, 
  FeatureTabs, 
  RoadmapSection, 
  TestimonialSection, 
  FAQSection, 
  FinalCTA,
  UseCaseGrid,
  IntegrationCard,
  Container,
  Section
} from '@schoolerp/ui';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School ERP - The Operating System for Modern Education',
  description: 'All-in-one platform for Academics, Finance, Safety, Operations, Communication, and Automation—built for Indian schools.',
};

export default function MarketingHomePage() {
  return (
    <main className="flex min-h-screen flex-col gap-24">
      <HeroSection />

      <Section className="bg-background">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[
              { label: 'Academics', value: 'End-to-end SIS, exams, homework' },
              { label: 'Finance', value: 'Audit-grade receipts, Tally-ready exports' },
              { label: 'Safety & Ops', value: 'Transport, visitor gate-pass, alerts' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary uppercase tracking-widest">{item.label}</p>
                <p className="mt-2 text-lg font-medium text-foreground/80">{item.value}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <FeatureTabs />
      <UseCaseGrid />

      <Section className="bg-muted/30">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Integrations</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Works with your stack</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Payments, messaging, accounting, and transport—plug in the partners you already use or tell us what to add next.
              </p>
            </div>
            <a href="/integrations" className="text-sm font-semibold text-primary hover:underline">
              View all integrations →
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { name: 'Razorpay', category: 'Payments', status: 'active', description: 'Collect online fees with automatic receipt triggers.', slug: 'razorpay' },
              { name: 'WhatsApp Business', category: 'Messaging', status: 'active', description: 'Absence and fee alerts directly on WhatsApp.', slug: 'whatsapp' },
              { name: 'Tally Prime', category: 'Accounting', status: 'active', description: 'Export-ready ledger mapping for Indian accounting.', slug: 'tally' },
            ].map((integration) => (
              <IntegrationCard key={integration.slug} {...integration} status="active" />
            ))}
          </div>
        </Container>
      </Section>

      <TestimonialSection />
      <FAQSection />
      <FinalCTA />
    </main>
  );
}
