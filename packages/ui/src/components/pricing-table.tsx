"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { Button } from './button';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

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
    <Section id="pricing" className="bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      <Container>
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6">
            Investment Plans
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-foreground sm:text-8xl mb-8 leading-[0.9]">
            Simple, honest <br />
            <span className="text-primary italic px-3">pricing</span>
          </h2>
          <p className="mt-8 text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            No hidden implementation fees. No complex contracts. <br className="hidden sm:block" />
            Empowering schools of all sizes with elite technology.
          </p>
          
          <div className="mt-16 flex justify-center">
            <div className="group flex items-center rounded-3xl border border-white/10 bg-muted/40 p-1.5 backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-[1.25rem] px-10 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-primary shadow-2xl shadow-primary/30 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-3 rounded-[1.25rem] px-10 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'annual' ? 'bg-primary shadow-2xl shadow-primary/30 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Yearly <span className={`text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white font-black ${billingCycle === 'annual' ? '' : 'bg-emerald-500/20 text-emerald-500'}`}>SAVE 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 pt-10 px-4 md:px-0">
          {PLANS.map((plan) => (
            <motion.div 
              key={plan.name} 
              whileHover={{ y: -12 }}
              className={cn(
                "group relative flex flex-col rounded-[2rem] border p-6 transition-all duration-500",
                plan.highlight 
                  ? "border-primary bg-slate-900 text-white shadow-[0_32px_80px_-16px_rgba(139,92,246,0.3)] z-10 scale-105" 
                  : "border-white/10 bg-card/60 backdrop-blur-3xl shadow-sm hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
              )}
            >
              {plan.tag && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-primary px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-primary/40">
                  {plan.tag}
                </div>
              )}
              
              <h3 className={cn(
                "text-2xl font-black tracking-tight",
                plan.highlight ? "text-white" : "text-foreground"
              )}>{plan.name}</h3>
              <p className={cn(
                "mt-4 text-[13px] font-bold leading-relaxed",
                plan.highlight ? "text-slate-400" : "text-muted-foreground"
              )}>{plan.description}</p>
              
              <div className="mt-12 flex items-baseline gap-2">
                {plan.price ? (
                  <>
                    <span className={cn(
                      "text-4xl xl:text-5xl font-black tracking-tighter italic",
                      plan.highlight ? "text-white" : "text-foreground"
                    )}>₹{Math.round(billingCycle === 'annual' ? (plan.price as number) * 0.8 : plan.price).toLocaleString()}</span>
                    <span className="text-muted-foreground font-black uppercase text-[9px] tracking-[0.2em] mb-2">/mo</span>
                  </>
                ) : (
                  <span className={cn(
                    "text-4xl xl:text-5xl font-black tracking-tighter italic uppercase",
                    plan.highlight ? "text-white" : "text-foreground"
                  )}>Global</span>
                )}
              </div>
              
              <div className={cn(
                "h-px w-full my-12",
                plan.highlight ? "bg-white/10" : "bg-white/5"
              )} />

              <ul className="space-y-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4 text-xs group/item">
                    <div className={cn(
                      "h-6 w-6 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110 shadow-lg",
                      plan.highlight ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}>
                      <Check className="h-4 w-4" />
                    </div>
                    <span className={cn(
                      "font-bold leading-tight group-hover/item:text-primary transition-colors",
                      plan.highlight ? "text-slate-300" : "text-foreground/80"
                    )}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.highlight ? 'default' : 'outline'} 
                className={cn(
                  "mt-12 w-full rounded-2xl h-16 text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-2xl",
                  plan.highlight 
                    ? "bg-primary text-white hover:bg-white hover:text-black hover:shadow-white/20" 
                    : "border-white/10 bg-white/5 text-foreground hover:border-primary hover:text-primary hover:shadow-primary/20"
                )}
                onClick={() => window.location.href = plan.price ? '/book-demo' : '/contact'}
              >
                {plan.price ? 'Start Activation' : 'Speak to Experts'}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 max-w-5xl mx-auto">
          <h3 className="text-3xl font-black text-center mb-10">Usage Add-ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Messaging Top-ups", desc: "WhatsApp & SMS wallet recharges.", price: "Pay-as-you-go" },
              { name: "Biometric / RFID", desc: "Device integration pack.", price: "₹5,000 / year" },
              { name: "Vehicle Tracking", desc: "GPS integration per bus.", price: "₹500 / mo" },
              { name: "Tally Export", desc: "Automated ledger mapping.", price: "₹10,000 / year" },
              { name: "Online Tests", desc: "Question bank & auto-grading.", price: "₹20 / student / year" },
              { name: "White-label App", desc: "Custom branded Play Store app.", price: "₹25,000 / year" },
            ].map((addon) => (
               <div key={addon.name} className="flex flex-col p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                 <h4 className="font-bold text-lg">{addon.name}</h4>
                 <p className="text-sm text-muted-foreground mt-1 mb-4 flex-1">{addon.desc}</p>
                 <div className="text-primary font-black text-sm uppercase tracking-wider">{addon.price}</div>
               </div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 rounded-[4rem] border border-white/10 bg-slate-900 px-12 py-16 text-center shadow-3xl overflow-hidden relative"
        >
          {/* Accent Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="max-w-3xl mx-auto relative z-10">
            <h4 className="text-3xl font-black text-white tracking-tight mb-6">Group or Multi-branch Management?</h4>
            <p className="text-slate-400 font-medium text-lg mb-10 leading-relaxed italic">
              "We provide high-compliance white-label solutions, multi-instance data isolation, and dedicated deployment engineers for seamless migration from legacy systems."
            </p>
            <Button size="lg" className="rounded-full h-16 px-14 text-sm font-black uppercase tracking-widest bg-white text-black hover:bg-primary hover:text-white transition-all shadow-2xl shadow-white/10" onClick={() => window.location.href = '/contact'}>
              Executive Consultation <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
};
