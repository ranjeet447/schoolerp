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
    <main className="flex min-h-screen flex-col">
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
      
      <Section className="bg-background border-y">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Optional AI Add-ons (Paid)</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Intelligence with guardrails. Off by default, enabled only if purchased.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-primary uppercase tracking-widest">
              <span>Off by default</span>
              <span className="text-muted-foreground">•</span>
              <span>Enabled only if purchased</span>
              <span className="text-muted-foreground">•</span>
              <span>Metered usage</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Teacher Copilot", 
                description: "Draft lesson plans and quizzes. Teacher-in-the-loop ensures accuracy.",
                icon: "Sparkles"
              },
              { 
                title: "Parent Helpdesk", 
                description: "24/7 automated support bot grounded in your school's official records.",
                icon: "MessageSquare"
              },
              { 
                title: "Fee Intelligence", 
                description: "Predictive flags for payment delays and explainable risk analysis.",
                icon: "BarChart3"
              }
            ].map((feature) => (
              <div key={feature.title} className="p-8 rounded-3xl border bg-card/50 hover:shadow-xl transition-all group">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <div className="h-6 w-6 font-bold text-xl uppercase">{feature.title[0]}</div>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

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
