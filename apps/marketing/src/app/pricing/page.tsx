import React from 'react';
import { 
  PricingTable, 
  FAQSection,
  TestimonialSection,
  FinalCTA
} from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School ERP Pricing | Add-ons + Credits for SMS/WhatsApp',
  description: 'School ERP pricing for Indian schools with optional monthly add-ons and credit-based SMS/WhatsApp usage. Plans include generous monthly credits; top-ups required beyond limits.',
  keywords: [
    'school erp pricing',
    'school fee management software pricing',
    'school whatsapp notification pricing',
    'school sms credits pricing',
    'school erp add-on pricing'
  ],
  alternates: {
    canonical: 'https://schoolerp.com/pricing',
  },
};

export default function PricingPage() {
  return (
    <main>
      <div className="pt-32 pb-12 text-center bg-muted/20">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Simple Pricing for Schools</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Core subscription + optional monthly add-ons + credit top-ups for usage-heavy channels like SMS and WhatsApp.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <a href="/features" className="text-primary hover:underline">Compare Features</a>
          <a href="/use-cases" className="text-primary hover:underline">See Use Cases</a>
          <a href="/integrations" className="text-primary hover:underline">Integrations</a>
          <a href="/book-demo" className="text-primary hover:underline">Book Demo</a>
        </div>
      </div>

      <PricingTable />

      <section className="py-12 border-y border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="text-lg font-bold">Add-ons are monthly subscriptions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Features like Payments Pro, Live Classes (Google / Microsoft), WhatsApp, and advanced modules are enabled per school as monthly add-ons.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="text-lg font-bold">Credits are usage-based</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Plans include generous monthly SMS/WhatsApp credits (and email credits only when an email gateway is enabled for your deployment). After included credits are used, schools buy top-up packs before sending more to prevent uncontrolled platform-side spend.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="text-lg font-bold">Built-in cost controls</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Messaging and provider usage is blocked when balances are insufficient, preventing uncontrolled platform-side spend and surprise overages.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-muted-foreground">
            Tenant admins manage add-ons and credits from the product billing pages after onboarding. Contact sales for institutional pricing, rollout approvals, and custom included-credit bundles.
          </div>
        </div>
      </section>
      
      <div className="py-12 bg-muted/10">
        <TestimonialSection />
      </div>

      <FAQSection />
      <FinalCTA />
    </main>
  );
}
