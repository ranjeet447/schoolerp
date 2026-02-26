import React from 'react';
import { 
  PricingTable, 
  FAQSection,
  TestimonialSection,
  FinalCTA
} from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - School ERP',
  description: 'Transparent pricing for schools of all sizes. No hidden implementation fees.',
};

export default function PricingPage() {
  return (
    <main>
      <div className="pt-32 pb-12 text-center bg-muted/20">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Invest in Efficiency</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Our pricing scales with your student count. Start small, grow indefinitely.
        </p>
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
                Plans include free monthly allowances for SMS/WhatsApp (and email credits where an email gateway adapter is enabled for your deployment). After included credits are used, schools buy top-up packs before sending more.
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
