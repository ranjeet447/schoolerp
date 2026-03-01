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
  Section,
  MockupFrame
} from '@schoolerp/ui';
import Link from 'next/link';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Fee Management, Parent App, Attendance & Exams | School ERP',
  description: 'School ERP software for online fee collection & dues management, parent communication app, attendance management (biometric-ready), and exam results/report cards for Indian schools.',
  keywords: [
    'school fee management software',
    'school fee collection software',
    'parent communication app for schools',
    'school attendance management system',
    'biometric attendance for schools',
    'exam management software for schools',
    'report card software for schools'
  ],
  alternates: {
    canonical: 'https://schoolerp.com',
  },
};

export default function MarketingHomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />

      <Section className="bg-background">
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {[
              { label: 'Online Fee Collection & Dues', value: 'UPI payments, reminders, receipts, dues tracking' },
              { label: 'Parent Communication & Parent App', value: 'Notices, alerts, parent portal updates in real time' },
              { label: 'Attendance Management', value: 'Daily attendance with biometric/RFID-ready support' },
              { label: 'Exams, Results & Report Cards', value: 'Marks entry, results publishing, report card generation' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-primary uppercase tracking-widest">{item.label}</p>
                <p className="mt-2 text-lg font-medium text-foreground/80">{item.value}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/20 border-y">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Core Pillars</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Most schools start with these 4</h2>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                We keep the buying journey simple: start with fee collection, parent communication, attendance, and exams/report cards. Add advanced modules only when needed.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/features" className="text-primary hover:underline">Explore Features</Link>
              <Link href="/use-cases" className="text-primary hover:underline">Use Cases</Link>
              <Link href="/pricing" className="text-primary hover:underline">Pricing & Credits</Link>
              <Link href="/book-demo" className="text-primary hover:underline">Book Demo</Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: 'Online Fee Collection & Dues Management',
                keyword: 'school fee management software',
                desc: 'Collect fees online, track dues, send reminders, and issue receipts instantly with UPI-ready workflows.',
                img: '/product-screens/accountant/accountant-dashboard.png',
                alt: 'School fee collection and dues management dashboard screenshot',
                href: '/features/fee-management-software',
              },
              {
                title: 'Parent Communication & Parent App (Real-time Updates)',
                keyword: 'parent communication app for schools',
                desc: 'Send notices, fee reminders, and absence alerts while parents track updates in the parent app/parent portal.',
                img: '/product-screens/parent/parent-dashboard.png',
                alt: 'Parent app communication dashboard screenshot for school notices and updates',
                href: '/features/whatsapp-notifications',
              },
              {
                title: 'Attendance Management (Biometric/RFID Support)',
                keyword: 'school attendance management system',
                desc: 'Mark daily attendance quickly and extend to biometric/RFID integrations for reliable school attendance workflows.',
                img: '/product-screens/teacher/teacher-attendance.png',
                alt: 'Teacher attendance management screen with biometric-ready workflows',
                href: '/features/attendance-management',
              },
              {
                title: 'Exam Management, Results & Report Cards',
                keyword: 'exam management software for schools',
                desc: 'Manage marks entry, publish results, and generate board-compliant report cards for parents and students.',
                img: '/product-screens/admin/admin-dashboard.png',
                alt: 'School exam management and report card dashboard screenshot',
                href: '/features/report-card-generator',
              },
            ].map((pillar) => (
              <Link key={pillar.title} href={pillar.href} className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                <MockupFrame src={pillar.img} alt={pillar.alt} className="w-full rounded-xl border" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary">{pillar.keyword}</p>
                <h3 className="mt-2 text-xl font-bold tracking-tight group-hover:text-primary">{pillar.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pillar.desc}</p>
              </Link>
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

      <Section className="bg-background">
        <Container>
          <div className="rounded-2xl border bg-card p-6 md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">How pricing works for schools</h2>
            <p className="mt-3 text-muted-foreground">
              Core school ERP features are subscription-based. Optional add-ons are monthly subscriptions. SMS/WhatsApp credits are usage-based with generous included monthly credits and top-ups when limits are crossed.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link href="/pricing" className="font-semibold text-primary hover:underline">See Pricing & Credits →</Link>
              <Link href="/integrations" className="font-semibold text-primary hover:underline">See Integrations →</Link>
              <Link href="/blog" className="font-semibold text-primary hover:underline">Read School ERP Guides →</Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/30">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Integrations</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Works with your school stack</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Payment gateways, messaging, accounting, and live classes integrations for Indian schools. Plug in the tools you already use.
              </p>
            </div>
            <a href="/integrations" className="text-sm font-semibold text-primary hover:underline">
              View all integrations →
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { name: 'Razorpay', category: 'Payments', status: 'active', description: 'Collect online fees with automatic receipt triggers.', slug: 'razorpay' },
              { name: 'WhatsApp Business', category: 'Messaging', status: 'beta', description: 'Absence and fee alerts directly on WhatsApp.', slug: 'whatsapp' },
              { name: 'Tally Prime', category: 'Accounting', status: 'beta', description: 'CSV export-ready ledger mapping for Indian accounting.', slug: 'tally' },
            ].map((integration) => (
              <IntegrationCard key={integration.slug} {...integration} />
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
