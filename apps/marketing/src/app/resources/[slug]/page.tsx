import React from 'react';
import { 
  Container, 
  Section, 
  FinalCTA, 
  RESOURCES_DATA,
  Breadcrumbs,
  RelatedContent,
  Button
} from '@schoolerp/ui';
import { Metadata } from 'next';
import { FileText, Download, CheckCircle, ShieldCheck, Share2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ResourcePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return RESOURCES_DATA.map(r => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = RESOURCES_DATA.find(r => r.slug === slug);
  if(!resource) return { title: 'Not Found' };
  
  return {
    title: `${resource.title} | School Management Resource`,
    description: resource.description,
    alternates: {
      canonical: `https://schoolerp.com/resources/${slug}`
    }
  };
}

export default async function ResourceDetailPage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const resource = RESOURCES_DATA.find(r => r.slug === slug);

  if (!resource) notFound();

  const breadcrumbItems = [
    { label: 'Resources', href: '/resources' },
    { label: resource.title }
  ];

  // Pick 2 related resources
  const related = RESOURCES_DATA.filter(r => r.slug !== slug).slice(0, 2).map(r => ({
    type: 'Resource' as const,
    title: r.title,
    description: r.description,
    href: `/resources/${r.slug}`
  }));

  return (
    <main className="pt-24 min-h-screen bg-background text-foreground">
      <Section className="bg-muted/10 pb-16 pt-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
        <Container className="relative z-10">
          <Breadcrumbs items={breadcrumbItems} />
          
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center mt-12">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest">
                <FileText className="w-4 h-4" /> {resource.category}
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
                {resource.title}
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
                {resource.description}
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-12 h-14 text-lg font-black group shadow-xl shadow-primary/25" asChild>
                  <Link href="/book-demo">
                    Get Free Copy <Download className="ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  </Link>
                </Button>
                <button className="h-14 w-14 rounded-full border border-border flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm">
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="user" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  <span className="text-foreground font-bold">1,200+</span> school leaders downloaded this
                </div>
              </div>
            </div>

            <div className="lg:w-[450px] relative">
               <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full translate-y-20 opacity-40" />
               <div className="relative rounded-[3rem] border border-white/20 bg-card overflow-hidden shadow-3xl aspect-[3/4] p-12 flex flex-col justify-between">
                  {/* Decorative background for the 'book' or 'checklist' */}
                  <div className={`absolute top-0 inset-x-0 h-40 ${resource.color} opacity-40 blur-3xl`} />
                  
                  <div className="relative z-10">
                    <div className={`h-20 w-20 rounded-3xl ${resource.color} flex items-center justify-center text-white shadow-2xl mb-12`}>
                       <FileText className="w-10 h-10" />
                    </div>
                    <div className="space-y-4">
                      <div className="h-2 w-24 bg-primary/20 rounded-full" />
                      <div className="h-2 w-full bg-muted rounded-full" />
                      <div className="h-2 w-full bg-muted rounded-full opacity-60" />
                      <div className="h-2 w-2/3 bg-muted rounded-full opacity-40" />
                    </div>
                  </div>

                  <div className="relative z-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-4">Official Publication</p>
                    <div className="font-bold text-foreground opacity-30 text-2xl tracking-widest">SchoolERP</div>
                  </div>
               </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
             <div className="grid md:grid-cols-2 gap-16 mb-24">
                <div className="space-y-8">
                   <h2 className="text-3xl font-black tracking-tight">What's inside?</h2>
                   <ul className="space-y-4">
                     {resource.points.map((point, i) => (
                       <li key={i} className="flex items-center gap-4 text-lg font-medium text-muted-foreground">
                         <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> {point}
                       </li>
                     ))}
                   </ul>

                </div>
                <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100/50">
                   <h3 className="text-xl font-black text-emerald-800 mb-4 flex items-center gap-2">
                     <ShieldCheck className="w-6 h-6" /> Verified Quality
                   </h3>
                   <p className="text-emerald-700/80 font-medium">
                     This resource is reviewed annually by our educational consultants to ensure it remains compliant with the latest CBSE/ICSE and State Board directives.
                   </p>
                </div>
             </div>

             <RelatedContent items={related} />
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
