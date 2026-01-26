"use client";

import React, { useState } from 'react';
import { Container, Section } from './layout-foundation';
import { Button } from './button';
import { Check } from 'lucide-react';
import { Badge } from './badge';

const PLANS = [
  {
    name: "Starter",
    price: 5000,
    description: "Core features for smaller schools.",
    features: [
      "Up to 1,000 students", 
      "SIS & Attendance", 
      "Fee Receipts", 
      "5 Automation Rules", 
      "7-Day Audit Logs"
    ],
    highlight: false
  },
  {
    name: "Standard",
    price: 12000,
    description: "For growing schools scaling operations.",
    features: [
      "Up to 3,000 students", 
      "Tally Export Integration", 
      "Transport & Library", 
      "30 Automation Rules", 
      "30-Day Audit Logs"
    ],
    highlight: true,
    tag: "Most Popular"
  },
  {
    name: "Premium",
    price: 25000,
    description: "Advanced controls for elite institutions.",
    features: [
      "Unlimited students", 
      "Smart Alert Management", 
      "2FA & Secure Access", 
      "Unlimited Automations", 
      "90-Day Audit Logs"
    ],
    highlight: false
  },
  {
    name: "Enterprise",
    price: null,
    description: "Custom solutions for school groups.",
    features: [
      "Multi-branch Dashboards", 
      "White-label Mobile Apps", 
      "Custom SLA & Support", 
      "Automation Sandbox", 
      "3-Year Compliance Logs"
    ],
    highlight: false
  }
];

export const PricingTable = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <Section id="pricing" className="bg-background">
      <Container>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No hidden implementation fees. Cancel anytime.
          </p>
          
          <div className="mt-8 flex justify-center">
            <div className="flex items-center rounded-full border bg-muted p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${billingCycle === 'annual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Yearly <span className="text-xs text-primary font-bold hidden sm:inline">-20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all hover:shadow-md ${plan.highlight ? 'border-primary ring-1 ring-primary' : 'bg-card'}`}
            >
              {plan.tag && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  {plan.tag}
                </div>
              )}
              
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                {plan.price ? (
                  <>
                    <span className="text-4xl font-bold">₹{(billingCycle === 'annual' ? (plan.price as number) * 0.8 : plan.price).toLocaleString()}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold">Custom</span>
                )}
              </div>
              
              <ul className="mt-8 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.highlight ? 'default' : 'outline'} 
                className="mt-8 w-full rounded-2xl h-12 font-bold"
                onClick={() => window.location.href = plan.price ? '/book-demo' : '/contact'}
              >
                {plan.price ? 'Start Free Trial' : 'Contact Sales'}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border bg-muted/30 p-8 text-center">
          <h4 className="text-lg font-semibold">Enterprise or Multi-branch Group?</h4>
          <p className="mt-2 text-muted-foreground">We offer custom SLAs, white-label mobile apps, and dedicated migration engineers.</p>
          <Button variant="link" className="mt-4 text-primary" onClick={() => window.location.href = '/contact'}>
            Contact Sales &rarr;
          </Button>
        </div>
      </Container>
    </Section>
  );
};
