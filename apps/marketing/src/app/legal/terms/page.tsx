import React from 'react';
import { Container, Section } from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - School ERP',
  description: 'Our agreement with your institution.',
};

export default function TermsPage() {
  return (
    <main>
      <div className="pt-24 pb-12 bg-muted/20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Effective Date: Jan 01, 2026</p>
      </div>

      <Section>
        <Container size="small" className="prose prose-slate dark:prose-invert lg:prose-lg mx-auto">
          <h2>1. Service Usage</h2>
          <p>
            By subscribing to School ERP, you are granted a non-exclusive, non-transferable license to use 
            our software for your institution's internal management purposes.
          </p>

          <h2>2. Availability SLA</h2>
          <p>
            We commit to a 99.9% uptime SLA. In case of downtime exceeding 1 hour per month, you are eligible 
            for service credits pro-rated to the downtime duration.
          </p>

          <h2>3. Payment Terms</h2>
          <p>
            Subscription fees are billed in advance (monthly or annually). Failure to pay within 15 days of 
            invoice generation may result in temporary service suspension.
          </p>

          <h2>4. Termination</h2>
          <p>
            You may cancel your subscription at any time. We will provide a full export of your data in CSV/SQL 
            format upon termination.
          </p>
        </Container>
      </Section>
    </main>
  );
}
