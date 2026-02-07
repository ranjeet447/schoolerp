"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    <Section id="pricing" className="bg-slate-50/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl mb-6">
            Simple, honest <span className="text-primary italic">pricing</span>
          </h2>
          <p className="mt-4 text-xl text-slate-600 font-medium">
            No hidden implementation fees. No complex contracts. <br className="hidden sm:block" />
            Empowering schools of all sizes.
          </p>
          
          <div className="mt-12 flex justify-center">
            <div className="flex items-center rounded-2xl border bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-xl px-8 py-2.5 text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-primary shadow-lg shadow-primary/20 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-black transition-all ${billingCycle === 'annual' ? 'bg-primary shadow-lg shadow-primary/20 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Yearly <span className={`text-[10px] uppercase tracking-tighter px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-black ${billingCycle === 'annual' ? 'bg-white/20 text-white' : ''}`}>SAVE 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4 pt-4">
          {PLANS.map((plan) => (
            <motion.div 
              key={plan.name} 
              whileHover={{ y: -8 }}
              className={`relative flex flex-col rounded-[2.5rem] border-2 p-10 bg-white transition-all duration-500 ${plan.highlight ? 'border-primary shadow-2xl shadow-primary/10 relative z-10' : 'border-slate-100 shadow-xl shadow-slate-200/50 hover:border-slate-300'}`}
            >
              {plan.tag && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/25">
                  {plan.tag}
                </div>
              )}
              
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
              <p className="mt-3 text-sm text-slate-500 font-semibold leading-relaxed">{plan.description}</p>
              
              <div className="mt-10 flex items-baseline gap-2">
                {plan.price ? (
                  <>
                    <span className="text-5xl font-black tracking-tighter text-slate-900 italic">₹{Math.round(billingCycle === 'annual' ? (plan.price as number) * 0.8 : plan.price).toLocaleString()}</span>
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/mo</span>
                  </>
                ) : (
                  <span className="text-5xl font-black tracking-tighter text-slate-900 italic">Global</span>
                )}
              </div>
              
              <div className="h-px bg-slate-100 w-full my-10" />

              <ul className="space-y-5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4 text-sm group">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary transition-colors">
                      <Check className="h-3 w-3 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.highlight ? 'default' : 'outline'} 
                className={`mt-12 w-full rounded-2xl h-14 text-base font-black transition-all ${plan.highlight ? 'shadow-xl shadow-primary/20 hover:shadow-primary/40' : 'border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-900'}`}
                onClick={() => window.location.href = plan.price ? '/book-demo' : '/contact'}
              >
                {plan.price ? 'Start Activation' : 'Speak to Experts'}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-24 rounded-[3rem] border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm p-12 text-center group hover:border-primary/30 transition-colors"
        >
          <div className="max-w-2xl mx-auto">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-primary transition-colors">Enterprise or Multi-branch Group?</h4>
            <p className="text-slate-600 font-semibold mb-8 line-height-relaxed">We offer custom SLAs, white-label mobile apps for Android & iOS, and dedicated migration engineers for zero-downtime implementation.</p>
            <Button size="lg" variant="outline" className="rounded-2xl h-14 px-12 font-black border-slate-200 text-slate-900 hover:border-primary hover:text-primary transition-all" onClick={() => window.location.href = '/contact'}>
              Request Executive Consultation &rarr;
            </Button>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
};
