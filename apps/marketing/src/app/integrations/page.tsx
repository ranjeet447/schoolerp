import React from 'react';
import { 
  Container, Section, FinalCTA, INTEGRATIONS_DATA, Breadcrumbs, Button
} from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, Zap, ArrowRight, Plus,
  CreditCard, MessageSquare, Video, Cloud, Calculator, Fingerprint, 
  Lock, HardDrive, Phone, MapPin, BookOpen, Bell, Sparkles, Search 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'School ERP Integrations | Razorpay, PayU, Google, Microsoft, Tally',
  description: 'School ERP integrations for payment gateways, parent communication providers, live classes (Google Workspace/Microsoft 365), accounting exports, and biometric attendance devices.',
  keywords: [
    'razorpay school fee collection integration',
    'payu school fee payment gateway',
    'google workspace education live classes integration',
    'microsoft 365 education teams integration school',
    'tally school accounting export',
    'biometric attendance for schools'
  ],
  alternates: {
    canonical: 'https://schoolerp.com/integrations',
  }
};

const CATEGORIES = [
  'All', 'Payments', 'Communication', 'Hardware', 'LMS', 'Cloud', 'Accounting'
];

const ICON_MAP: Record<string, any> = {
  CreditCard, MessageSquare, Video, Cloud, Calculator, Fingerprint, Lock, HardDrive, Phone, MapPin, BookOpen, Bell
};

export default function IntegrationsListingPage() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/20">
      {/* Hero Header */}
      <div className="relative pt-32 pb-20 overflow-hidden border-b border-border/50 bg-muted/20">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
         
         <Container className="relative z-10 text-center">
            <Breadcrumbs items={[{ label: 'Integrations' }]} className="justify-center mb-8" />
            
            <h1 className="text-5xl font-black tracking-tight text-foreground md:text-7xl lg:text-8xl leading-[0.9] mb-8">
               One ERP. <br />
               <span className="text-primary italic">Every Tool You Use.</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground font-medium mb-12">
               Connect fee collection, parent communication, attendance devices, accounting exports, and live classes tools your school already uses.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto">
               <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search for an integration (e.g. Tally, Razorpay)..."
                    className="w-full h-14 pl-12 pr-6 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
               </div>
               <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-2xl border border-border/50">
                  {CATEGORIES.slice(0, 4).map(cat => (
                    <button key={cat} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${cat === 'All' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-background'}`}>
                      {cat}
                    </button>
                  ))}
               </div>
            </div>
         </Container>
      </div>

      {/* Main Grid */}
      <Section className="py-24">
         <Container>
            <div className="mb-8 flex flex-wrap gap-4 text-sm font-semibold">
              <Link href="/features" className="text-primary hover:underline">Features</Link>
              <Link href="/use-cases" className="text-primary hover:underline">Use Cases</Link>
              <Link href="/pricing" className="text-primary hover:underline">Pricing & Credits</Link>
              <Link href="/book-demo" className="text-primary hover:underline">Book Demo</Link>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
               {INTEGRATIONS_DATA.map((integration) => {
                 const Icon = ICON_MAP[integration.iconName] || Zap;
                 return (
                   <Link 
                     key={integration.slug} 
                     href={`/integrations/${integration.slug}`}
                     className="group relative flex flex-col bg-card rounded-[3rem] p-10 border border-border/50 shadow-sm hover:shadow-2xl hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                   >
                     {/* Decorative Background Blob */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                     
                     <div className="absolute top-8 left-8">
                        <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                           <Icon className="h-8 w-8" />
                        </div>
                     </div>

                     <div className="mt-20 flex-1">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{integration.category}</span>
                           <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Available / Beta
                           </div>
                        </div>
                        <h3 className="text-3xl font-black tracking-tight mb-4 group-hover:text-primary transition-colors">{integration.name}</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed line-clamp-2">
                           {integration.shortDescription}
                        </p>
                     </div>

                     <div className="mt-10 pt-8 border-t border-border/50 flex items-center justify-between">
                        <div className="flex -space-x-2">
                           {integration.compliance.map((c, i) => (
                             <div key={i} className="h-6 px-2 flex items-center justify-center rounded-md bg-muted text-[10px] font-black border border-border/50">
                               {c}
                             </div>
                           ))}
                        </div>
                        <div className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                           <ArrowRight className="h-5 w-5" />
                        </div>
                     </div>
                   </Link>
                 );
               })}

               {/* Request New Card */}
               <div className="flex flex-col items-center justify-center bg-muted/20 rounded-[3rem] p-10 border-2 border-dashed border-border/50 text-center hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="h-16 w-16 rounded-3xl bg-border/20 flex items-center justify-center text-muted-foreground mb-6">
                     <Plus className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">Request Integration</h3>
                  <p className="text-sm text-muted-foreground font-medium mb-8">Can't find the tool you use? We'll build it for you.</p>
                  <Button variant="outline" className="rounded-xl px-8 h-12 border-border/50">Suggest Integration</Button>
               </div>
            </div>
         </Container>
      </Section>

      {/* Call to Action */}
      <Section className="pb-32">
         <Container>
            <div className="bg-primary/5 rounded-[4rem] p-16 border border-primary/10 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
               <div className="relative z-10 max-w-3xl">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Built for Openness.</h2>
                  <p className="text-xl text-muted-foreground font-medium mb-10 leading-relaxed">
                     Our REST API allows your technical team to build custom connections between SchoolERP and any internal database or proprietary hardware you might have.
                  </p>
                  <div className="flex flex-wrap gap-4">
                     <Button size="lg" className="rounded-2xl px-10 h-14 shadow-xl shadow-primary/20">View API Docs</Button>
                     <Button size="lg" variant="outline" className="rounded-2xl px-10 h-14 border-border/50 bg-background">Talk to Integrations Expert</Button>
                  </div>
               </div>
               <div className="absolute right-10 bottom-0 top-0 w-1/3 hidden lg:flex items-center justify-center opacity-10">
                  <Cloud className="h-96 w-96 text-primary" />
               </div>
            </div>
         </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
