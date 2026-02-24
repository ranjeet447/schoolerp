import React from 'react';
import { Container, Section, FinalCTA, TEMPLATES_DATA, Breadcrumbs, Button } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, Download, FileText, CheckCircle2, ChevronRight, 
  Sparkles, ShieldCheck, Zap, Globe, Share2, Bookmark, 
  FileCheck, FileDown, Rocket, Award, Info, ArrowRight,
  Monitor, Layout, Layers, Box, Cpu
} from 'lucide-react';

interface TemplatePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return TEMPLATES_DATA.map(template => ({ slug: template.slug }));
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = TEMPLATES_DATA.find(t => t.slug === slug);
  
  if (!template) return { title: 'Template Not Found' };

  return {
    title: `${template.title} | Download Verified School Formats`,
    description: template.shortDescription,
    alternates: {
      canonical: `https://schoolerp.com/templates/${slug}`,
    }
  };
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const template = TEMPLATES_DATA.find(t => t.slug === slug);

  if (!template) notFound();

  const related = TEMPLATES_DATA.filter(t => 
    template.relatedSlugs.includes(t.slug)
  ).slice(0, 3);

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/20">
       {/* Hero Section */}
       <div className="relative pt-32 pb-20 overflow-hidden border-b border-border/50">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none animate-pulse" />
          
          <Container className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="flex flex-col items-start text-left">
               <Breadcrumbs items={[
                 { label: 'Templates', href: '/templates' },
                 { label: template.title }
               ]} />

               <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary mb-8 shadow-sm">
                 <Sparkles className="h-4 w-4" /> Recommended {template.category} Asset
               </div>
               
               <h1 className="text-4xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[0.95] mb-8 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text">
                 {template.title}
               </h1>
               
               <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-xl leading-relaxed mb-12 italic">
                 "{template.shortDescription}"
               </p>

               <div className="flex flex-wrap gap-4 mb-12">
                  <Button size="xl" className="rounded-[2rem] gap-3 px-10 h-16 shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                    <Download className="h-6 w-6" /> 
                    Download Free {template.downloadFormat}
                  </Button>
               </div>

               <div className="flex items-center gap-8 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Verified Format</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span>Compliance Ready</span>
                  </div>
               </div>
            </div>

            <div className="relative group">
               <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-indigo-500/20 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="relative aspect-[4/5] max-w-md mx-auto rounded-[3rem] overflow-hidden bg-card border-[8px] border-white/10 dark:border-white/5 shadow-2xl skew-y-3 hover:skew-y-0 transition-all duration-700">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  {/* Mock content representation */}
                  <div className="p-10 space-y-6">
                     <div className="h-12 w-2/3 bg-muted rounded-xl animate-pulse" />
                     <div className="grid grid-cols-2 gap-4">
                        <div className="h-8 w-full bg-muted rounded-lg" />
                        <div className="h-8 w-full bg-muted rounded-lg" />
                     </div>
                     <div className="h-48 w-full bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center">
                        <FileText className="h-16 w-16 text-primary/30" />
                     </div>
                     <div className="space-y-3">
                        <div className="h-4 w-full bg-muted rounded" />
                        <div className="h-4 w-5/6 bg-muted rounded" />
                        <div className="h-4 w-2/3 bg-muted rounded" />
                     </div>
                  </div>
                  <div className="absolute bottom-10 left-10 right-10 p-6 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-between">
                     <div className="font-black text-xl text-primary">Preview</div>
                     <Zap className="h-6 w-6 text-primary animate-bounce" />
                  </div>
               </div>
            </div>
          </Container>
       </div>

       <Section className="bg-background py-20 relative">
          <Container className="lg:grid lg:grid-cols-12 gap-16 relative">
            
            {/* Sidebar UI */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-32 space-y-12">
                <div className="p-10 rounded-[3rem] bg-card border border-border/50 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 text-center">Template Features</h4>
                  <ul className="space-y-6">
                    {template.features.map(feature => (
                      <li key={feature} className="flex gap-4 items-start">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-bold text-foreground leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-10 rounded-[3rem] bg-primary/5 border border-primary/10 text-center flex flex-col items-center">
                   <div className="h-16 w-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary mb-6">
                     <Rocket className="h-8 w-8" />
                   </div>
                   <h5 className="font-black text-2xl text-foreground mb-3 leading-none">Automate this.</h5>
                   <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">Why fill forms manually? Use SchoolERP to generate all certificates instantly from student data.</p>
                   <Button className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20">Upgrade Now</Button>
                </div>
              </div>
            </aside>

            {/* Content Area */}
            <div className="lg:col-span-8">
              <article className="prose prose-slate dark:prose-invert lg:prose-xl mx-auto 
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-[2.5rem] prose-img:shadow-2xl
                prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                prose-strong:text-foreground prose-strong:font-black
                marker:text-primary">
                
                <div dangerouslySetInnerHTML={{ __html: template.longDescription }} />
                
                <div className="mt-20 p-12 rounded-[3.5rem] bg-muted/50 border border-border/50 flex flex-col md:flex-row items-center gap-10">
                   <div className="h-24 w-24 shrink-0 rounded-3xl bg-card border border-border/50 flex items-center justify-center">
                      <FileDown className="h-12 w-12 text-primary" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black mb-2">Ready to download?</h4>
                      <p className="text-muted-foreground font-medium leading-relaxed mb-6">
                        This template is fully editable and formatted for standard printers used across India.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <Button variant="outline" className="rounded-xl h-10 px-6 border-border/50 gap-2">
                           View Manual Guide
                        </Button>
                        <Button variant="outline" className="rounded-xl h-10 px-6 border-border/50 gap-2">
                           Email to Principal
                        </Button>
                      </div>
                   </div>
                </div>
              </article>
            </div>
          </Container>
       </Section>

       {/* Related Section */}
       <Section className="bg-muted/30 py-32 border-t border-border/50">
          <Container>
             <div className="mb-16 flex items-end justify-between">
               <div>
                  <h2 className="text-4xl font-black tracking-tight mb-4 leading-none">Complimentary Templates</h2>
                  <p className="text-muted-foreground font-medium text-lg">Other formats you might need for your school office.</p>
               </div>
               <Link href="/templates">
                 <Button variant="outline" className="rounded-2xl h-12 px-8 border-border/50 group">
                    Explore All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                 </Button>
               </Link>
             </div>

             <div className="grid gap-8 md:grid-cols-3">
                {related.map((relTemp) => (
                  <Link 
                    key={relTemp.slug} 
                    href={`/templates/${relTemp.slug}`} 
                    className="group bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-sm hover:shadow-2xl hover:border-primary/40 transition-all hover:-translate-y-2 flex flex-col"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 block">{relTemp.category}</span>
                    <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors mb-6 flex-1">
                      {relTemp.title}
                    </h3>
                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-foreground uppercase tracking-widest">
                         {relTemp.downloadFormat}
                      </div>
                      <div className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                ))}
             </div>
          </Container>
       </Section>

       <FinalCTA />
    </main>
  );
}