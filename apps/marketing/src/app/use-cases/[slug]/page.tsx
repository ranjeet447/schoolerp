import React from 'react';
import { 
  Container, 
  Section, 
  FinalCTA, 
  SoftwareApplicationSchema, 
  USE_CASES_DATA, 
  FEATURES_DATA,
  Breadcrumbs,
  RelatedContent
} from '@schoolerp/ui';
import { Metadata } from 'next';
import { CheckCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

interface UseCasePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return USE_CASES_DATA.map(uc => ({ slug: uc.slug }));
}

export async function generateMetadata({ params }: UseCasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = USE_CASES_DATA.find(uc => uc.slug === slug);
  if(!data) return { title: 'Not Found' };
  
  return {
    title: `${data.title} - Workflow Solution | SchoolERP`,
    description: `Learn how SchoolERP solves ${data.title.toLowerCase()} for Indian budget and private schools.`,
    alternates: {
      canonical: `https://schoolerp.com/use-cases/${slug}`
    }
  };
}

export default async function UseCaseDetailPage({ params }: UseCasePageProps) {
  const { slug } = await params;
  const data = USE_CASES_DATA.find(uc => uc.slug === slug);

  if (!data) notFound();

  const breadcrumbItems = [
    { label: 'Use Cases', href: '/use-cases' },
    { label: data.title }
  ];

  // Map related features from the slugs in data
  const relatedItems = data.relatedFeatures.map(fSlug => {
    const f = FEATURES_DATA.find(feat => feat.slug === fSlug);
    if (!f) return null;
    return {
      type: 'Feature' as const,
      title: f.title,
      description: f.description,
      href: `/features/${f.slug}`
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <main className="pt-24 min-h-screen bg-background">
      <SoftwareApplicationSchema name="School ERP" applicationCategory="EducationalApplication" description={data.longDescription} />

      <Section className="bg-muted/20 pb-16 pt-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <Container className="relative z-10">
          <Breadcrumbs items={breadcrumbItems} />
          
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center mt-12">
            <div className="flex-1">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary shadow-sm inline-block">
                For {data.targetRole.charAt(0).toUpperCase() + data.targetRole.slice(1)}s
              </span>
              <h1 className="mt-8 text-5xl font-black tracking-tighter text-foreground sm:text-7xl leading-[0.95]">
                {data.title}
              </h1>
              <p className="mt-6 text-xl text-muted-foreground font-medium max-w-xl">
                 {data.longDescription}
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-3xl border border-white/20 bg-card/60 backdrop-blur-xl p-8 lg:w-[400px] shadow-2xl">
               <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Key Outcome</div>
               <div className="text-4xl font-black text-foreground tracking-tight">{data.stats}</div>
               <p className="text-sm text-muted-foreground font-medium">Standard result achieved across our partner school network.</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-background pt-16 pb-24">
        <Container>
          <div className="grid gap-12 lg:gap-20 md:grid-cols-2 max-w-5xl mx-auto mb-24">
            <div className="rounded-[2.5rem] border border-red-200 bg-red-50/50 p-10 md:p-12 relative overflow-hidden">
              <div className="relative z-10">
                 <h2 className="text-3xl font-black text-red-700 tracking-tight mb-8">The Problem</h2>
                 <p className="text-lg text-foreground/80 font-medium leading-relaxed mb-6">
                   {data.problem}
                 </p>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-emerald-200 bg-emerald-50/50 p-10 md:p-12 relative overflow-hidden shadow-lg shadow-emerald-500/5">
              <div className="relative z-10">
                 <h2 className="text-3xl font-black text-emerald-700 tracking-tight mb-8">The Solution</h2>
                 <p className="text-lg text-foreground/90 font-bold leading-relaxed mb-6">
                   {data.solution}
                 </p>
                 <div className="flex items-center gap-3 text-emerald-600 font-bold">
                    <CheckCircle className="h-6 w-6" /> Verified Workflow
                 </div>
              </div>
            </div>
          </div>

          <RelatedContent items={relatedItems} />
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
