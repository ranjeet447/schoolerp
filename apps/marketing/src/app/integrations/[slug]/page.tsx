import React from 'react';
import { Container, Section, FinalCTA, IntegrationCard } from '@schoolerp/ui';
import { notFound } from 'next/navigation';
import { INTEGRATIONS } from '../data';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export async function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }));
}

export default function IntegrationDetailPage({ params }: { params: { slug: string } }) {
  const integration = INTEGRATIONS.find((i) => i.slug === params.slug);
  if (!integration) return notFound();

  return (
    <main>
      <Section className="bg-muted/30">
        <Container className="space-y-6">
          <Link href="/integrations" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to integrations
          </Link>
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit rounded-full border bg-background px-4 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Available
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight">{integration.name}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">{integration.description}</p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold">What this integration unlocks</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li>• Faster onboarding with guided setup.</li>
              <li>• Automatic sync with relevant modules (fees, notifications, transport, or identity depending on provider).</li>
              <li>• Alerts and monitoring so you know when a provider has issues.</li>
            </ul>
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="text-lg font-semibold">Status & Availability</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Available for all plans. Tell us your provider preference and we will enable it on onboarding.
              </p>
              <div className="mt-4 flex gap-3">
                <a href="/book-demo" className="text-sm font-semibold text-primary hover:underline">Book a demo</a>
                <a href="/contact" className="text-sm text-muted-foreground hover:text-primary">Request access</a>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <IntegrationCard {...integration} />
            {integration.docs && (
              <a
                href={integration.docs}
                className="block rounded-lg border bg-card p-4 text-sm font-semibold text-primary hover:underline"
              >
                View provider docs
              </a>
            )}
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
