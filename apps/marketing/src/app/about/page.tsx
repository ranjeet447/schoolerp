import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - School ERP',
  description: 'Our mission to digitize 10,000 schools in India.',
};

export default function AboutPage() {
  return (
    <main>
      <div className="pt-24 pb-12 bg-muted/20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Our Mission</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          To empower every school in India with enterprise-grade operational excellence.
        </p>
      </div>

      <Section>
        <Container className="space-y-16">
          <div className="prose prose-lg mx-auto text-muted-foreground">
            <p>
              School ERP was born out of a simple observation: Schools are building the future, 
              but they are running on software from the past.
            </p>
            <p>
              We saw principals struggling with disconnected spreadsheets, parents confused by 
              WhatsApp message chaos, and accountants drowning in receipt books. We knew 
              there had to be a better way.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
             <div className="rounded-xl border bg-card p-8 text-center">
               <div className="text-4xl font-bold text-primary">120+</div>
               <div className="mt-2 font-medium">Partner Schools</div>
             </div>
             <div className="rounded-xl border bg-card p-8 text-center">
               <div className="text-4xl font-bold text-primary">50k+</div>
               <div className="mt-2 font-medium">Students Managed</div>
             </div>
             <div className="rounded-xl border bg-card p-8 text-center">
               <div className="text-4xl font-bold text-primary">₹200Cr</div>
               <div className="mt-2 font-medium">Fees Processed</div>
             </div>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
