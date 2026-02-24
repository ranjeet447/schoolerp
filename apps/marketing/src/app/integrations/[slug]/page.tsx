import React from 'react';
import { 
  Container, Section, FinalCTA, INTEGRATIONS_DATA, Breadcrumbs, Button
} from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Zap, ShieldCheck, Clock, Award, Rocket, ArrowRight, ChevronRight,
  CreditCard, MessageSquare, Video, Cloud, Calculator, Fingerprint, 
  Lock, HardDrive, Phone, MapPin, BookOpen, Bell, CheckCircle2 
} from 'lucide-react';

interface IntegrationPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return INTEGRATIONS_DATA.map(integration => ({ slug: integration.slug }));
}

export async function generateMetadata({ params }: IntegrationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const integration = INTEGRATIONS_DATA.find(i => i.slug === slug);
  
  if (!integration) return { title: 'Integration Not Found' };

  return {
    title: `${integration.name} Integration for Schools | SchoolERP`,
    description: integration.shortDescription,
    alternates: {
      canonical: `https://schoolerp.com/integrations/${slug}`,
    }
  };
}

const ICON_MAP: Record<string, any> = {
  CreditCard, MessageSquare, Video, Cloud, Calculator, Fingerprint, Lock, HardDrive, Phone, MapPin, BookOpen, Bell
};

export default async function IntegrationDetailPage({ params }: IntegrationPageProps) {
  const { slug } = await params;
  const integration = INTEGRATIONS_DATA.find(i => i.slug === slug);

  if (!integration) notFound();

  const Icon = ICON_MAP[integration.iconName] || Zap;
  const related = INTEGRATIONS_DATA.filter(i => 
    integration.relatedSlugs.includes(i.slug)
  ).slice(0, 3);

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/20">
       {/* Hero Section */}
       <div className="relative pt-32 pb-20 overflow-hidden border-b border-border/50 bg-muted/30">
          <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          
          <Container className="relative z-10 text-center">
             <Breadcrumbs items={[
               { label: 'Integrations', href: '/integrations' },
               { label: integration.name }
             ]} className="justify-center mb-12" />

             <div className="inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-card border border-border/50 shadow-2xl mb-10 group hover:scale-110 transition-transform duration-500">
                <Icon className="h-12 w-12 text-primary group-hover:rotate-12 transition-transform" />
             </div>
             
             <h1 className="text-5xl font-black tracking-tight text-foreground md:text-7xl lg:text-8xl leading-[0.9] mb-8">
               {integration.name} <br />
               <span className="text-muted-foreground">+ SchoolERP</span>
             </h1>
             
             <p className="max-w-3xl mx-auto text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed mb-12">
               {integration.shortDescription}
             </p>

             <div className="flex flex-wrap justify-center gap-6 mb-16">
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-card border border-border/50 text-sm font-bold shadow-sm">
                   <Clock className="h-4 w-4 text-primary" />
                   Setup Time: {integration.setupTime}
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-card border border-border/50 text-sm font-bold shadow-sm">
                   <Award className="h-4 w-4 text-primary" />
                   {integration.category} Partner
                </div>
             </div>

             <div className="flex flex-wrap justify-center gap-4">
                <Button size="xl" className="rounded-2xl gap-3 px-10 h-16 shadow-2xl shadow-primary/20">
                  <Rocket className="h-6 w-6" /> Start Free Integration
                </Button>
                <Button size="xl" variant="outline" className="rounded-2xl px-10 h-16 border-border/50 bg-background">
                  Talk to Support
                </Button>
             </div>
          </Container>
       </div>

       <Section id="overview" className="py-24 relative overflow-hidden">
          <Container className="lg:grid lg:grid-cols-12 gap-20">
            
            <div className="lg:col-span-7">
               <article className="prose prose-slate dark:prose-invert lg:prose-xl 
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg
                prose-strong:text-foreground prose-strong:font-black
                marker:text-primary">
                
                <h2 className="text-4xl font-black mb-8">Elevate your school operations.</h2>
                <div dangerouslySetInnerHTML={{ __html: integration.longDescription }} />
               </article>
            </div>

            <aside className="lg:col-span-5">
               <div className="sticky top-40 space-y-10">
                  <div className="p-10 rounded-[3rem] bg-card border border-border/50 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                     <h3 className="text-2xl font-black mb-8">What's included?</h3>
                     <ul className="space-y-6">
                        {integration.features.map(f => (
                          <li key={f} className="flex gap-4 items-start group/item">
                             <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:bg-primary transition-colors">
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary group-hover/item:text-white" />
                             </div>
                             <span className="text-sm font-bold text-foreground leading-tight">{f}</span>
                          </li>
                        ))}
                     </ul>
                  </div>

                  <div id="compliance" className="p-10 rounded-[3rem] bg-muted/50 border border-border/50">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Security & Compliance</h4>
                     <div className="flex flex-wrap gap-3">
                        {integration.compliance.map(c => (
                          <div key={c} className="px-4 py-2 rounded-xl bg-background border border-border/50 text-xs font-black">
                            {c}
                          </div>
                        ))}
                     </div>
                     <p className="mt-8 text-xs text-muted-foreground font-medium leading-relaxed">
                        Our {integration.name} integration is regularly audited for security vulnerabilities and complies with global educational data standards.
                     </p>
                  </div>
               </div>
            </aside>
          </Container>
       </Section>

       {/* Related Integrations */}
       <Section id="related" className="bg-muted/30 py-32 border-t border-border/50">
          <Container>
             <div className="mb-16 flex items-end justify-between">
               <div>
                  <h2 className="text-4xl font-black tracking-tight mb-4">You might also need</h2>
                  <p className="text-muted-foreground font-medium text-lg">Integrations that complement the {integration.name} workflow.</p>
               </div>
               <Link href="/integrations">
                 <Button variant="outline" className="rounded-2xl h-12 px-8 border-border/50 group">
                    View All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                 </Button>
               </Link>
             </div>

             <div className="grid gap-8 md:grid-cols-3">
                {related.map((rel) => {
                  const RelIcon = ICON_MAP[rel.iconName] || Zap;
                  return (
                    <Link 
                      key={rel.slug} 
                      href={`/integrations/${rel.slug}`} 
                      className="group bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-sm hover:shadow-2xl hover:border-primary/40 transition-all hover:-translate-y-2 flex flex-col"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                        <RelIcon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors mb-4 flex-1">
                        {rel.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2 mb-8">
                        {rel.shortDescription}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{rel.category}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })}
             </div>
          </Container>
       </Section>

       <FinalCTA />
    </main>
  );
}
