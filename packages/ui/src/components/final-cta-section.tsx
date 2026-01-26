"use client";

import React from 'react';
import { Button } from './button';
import { Container, Section } from './layout-foundation';

export const FinalCTA = () => {
  return (
    <Section spacing="large" className="bg-primary">
      <Container className="flex flex-col items-center text-center text-primary-foreground">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Ready to transform your school?
        </h2>
        <p className="mt-6 max-w-2xl text-xl opacity-90">
          Join hundreds of progressive schools across India that have digitized their operations with School ERP.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" variant="secondary" className="rounded-full px-8 text-lg" onClick={() => window.location.href = '/book-demo'}>
            Book a Demo
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-primary-foreground/20 px-8 text-lg hover:bg-white/10" onClick={() => window.location.href = '/contact'}>
            Request Callback
          </Button>
        </div>
      </Container>
    </Section>
  );
};
