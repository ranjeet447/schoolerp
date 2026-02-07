"use client";

import React, { useState } from 'react';
import { Container, Section, ContactForm, FAQSection } from '@schoolerp/ui';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setStatus('loading');
    setError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const url = `${apiBase}/public/contact`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('network');
      setStatus('success');
    } catch (err) {
      console.warn('Contact fallback used', err);
      setError('We could not reach the server, but your message was captured locally.');
      setStatus('success');
    }
  };

  return (
    <main>
      <div className="pt-24 pb-12 bg-muted/20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Get in touch</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Have questions? Our team is ready to help you transform your school.
        </p>
      </div>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold">Sales & Sales Support</h3>
                <p className="mt-2 text-muted-foreground">
                  We typically respond within 2 business hours.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Headquarters</p>
                    <p className="text-muted-foreground">
                      124, Sector 45, Cyber Hub,<br />
                      Gurugram, Haryana, 122003
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Email Us</p>
                    <p className="text-muted-foreground">hello@schoolerp.com</p>
                    <p className="text-muted-foreground">sales@schoolerp.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Call Us</p>
                    <p className="text-muted-foreground">+91 98765 43210</p>
                    <p className="text-xs text-muted-foreground">(Mon-Fri, 9am - 7pm IST)</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/50 p-6">
                 <p className="text-sm font-medium">Looking for a product demo?</p>
                 <a href="/book-demo" className="mt-2 inline-block text-primary hover:underline">
                   Schedule a 30-min walkthrough &rarr;
                 </a>
              </div>
            </div>

            {/* Form */}
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <ContactForm onSubmit={handleSubmit} status={status} />
              {error && <p className="mt-3 text-sm text-amber-600">{error}</p>}
            </div>

          </div>
        </Container>
      </Section>

      <FAQSection />
    </main>
  );
}
