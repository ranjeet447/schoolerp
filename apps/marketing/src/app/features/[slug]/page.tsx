import React from 'react';
import { notFound } from 'next/navigation';
import { 
  FEATURES_DATA, 
  Container, 
  Section, 
  Button, 
  FinalCTA,
  IconMapper,
  FeatureMockup
} from '@schoolerp/ui';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface FeaturePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function FeatureDetailPage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = FEATURES_DATA.find((f) => f.slug === slug);

  if (!feature) {
    notFound();
  }

  return (
    <main className="pt-24 min-h-screen bg-background">
      <Section spacing="large" className="bg-muted/30 overflow-hidden">
        <Container>
          <Link 
            href="/#features" 
            className="inline-flex items-center gap-2 text-primary font-bold mb-8 hover:translate-x-1 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Features
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-xl ${feature.color}`}>
                <IconMapper name={feature.icon} size={32} />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
                {feature.title}
              </h1>
              <p className="text-2xl text-muted-foreground leading-relaxed">
                {feature.longDescription}
              </p>
              <div className="pt-4">
                <Button size="lg" className="rounded-full px-10 text-lg" asChild>
                  <Link href="/book-demo">
                    Book a Demo
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-colors" />
              <div className="relative h-auto min-h-[400px] rounded-3xl border bg-card shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="mx-auto rounded-md bg-background/50 px-6 py-1 text-[10px] text-muted-foreground font-mono">
                    school-erp.com/dashboard/{feature.id}
                  </div>
                </div>
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
                  <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center text-white shadow-lg`}>
                    <IconMapper name={feature.icon} size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg">{feature.mockUI.title}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-60">Module Interface Preview</p>
                  </div>
                  
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
                  
                  <FeatureMockup type={feature.mockUI.type} color={feature.color} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight mb-12">Key Capabilities & Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {feature.benefits.map((benefit, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`mt-1 shrink-0 h-6 w-6 rounded-full ${feature.color}/10 flex items-center justify-center`}>
                    <CheckCircle2 className={`h-4 w-4 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-lg font-bold text-foreground/80">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
