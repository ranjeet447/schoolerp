"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { Button } from './button';
import { Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { PRICING_PLANS, PLUGINS, ONBOARDING_FEES, FAQS } from '../constants/pricing';

export const PricingTable = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <Section id="pricing" className="bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      <Container>
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6">
            Base Plans + Plugins
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-foreground sm:text-7xl mb-6 leading-[0.9]">
            Transparent <br />
            <span className="text-primary italic px-3">pricing</span>
          </h2>
          <p className="mt-6 text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Start with a base plan. Add powerful plugins as you grow. <br className="hidden sm:block" />
            No hidden fees. Pay only for what you use.
          </p>
          
          {/* Monthly / Yearly Toggle */}
          <div className="mt-12 flex justify-center">
            <div className="group flex items-center rounded-3xl border border-white/10 bg-muted/40 p-1.5 backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-[1.25rem] px-8 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-primary shadow-2xl shadow-primary/30 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-2 rounded-[1.25rem] px-8 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'annual' ? 'bg-primary shadow-2xl shadow-primary/30 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Yearly <span className={`text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-lg text-white font-black ${billingCycle === 'annual' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/80 text-white'}`}>SAVE ~17%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 pt-10 px-4 md:px-0 mb-12">
          {PRICING_PLANS.map((plan) => (
            <motion.div 
              key={plan.name} 
              whileHover={{ y: -8 }}
              className={cn(
                "group relative flex flex-col rounded-[2rem] border p-6 transition-all duration-500 h-full",
                plan.highlight 
                  ? "border-primary bg-slate-900 text-white shadow-[0_32px_80px_-16px_rgba(139,92,246,0.3)] z-10 scale-105" 
                  : "border-white/10 bg-card/60 backdrop-blur-3xl shadow-sm hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                  {plan.tag}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className={cn(
                  "text-xl font-black tracking-tight",
                  plan.highlight ? "text-white" : "text-foreground"
                )}>{plan.name}</h3>
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider mt-1 opacity-70",
                  plan.highlight ? "text-slate-300" : "text-muted-foreground"
                )}>{plan.limit}</p>
                 <p className={cn(
                  "mt-3 text-sm font-medium leading-normal",
                  plan.highlight ? "text-slate-400" : "text-muted-foreground"
                )}>{plan.description}</p>
              </div>
              
              <div className="mb-8 p-4 rounded-xl bg-background/5 border border-white/5">
                {plan.priceMonthly !== null ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-3xl font-black tracking-tighter",
                        plan.highlight ? "text-white" : "text-foreground"
                      )}>
                        ₹{(billingCycle === 'annual' ? Math.round(plan.priceYearly! / 12) : plan.priceMonthly).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold uppercase opacity-60">/mo</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <div className="text-[10px] text-emerald-500 font-bold mt-1">
                        Billed ₹{(plan.priceYearly!).toLocaleString()} yearly
                      </div>
                    )}
                  </>
                ) : (
                  <span className={cn(
                    "text-3xl font-black tracking-tighter uppercase",
                    plan.highlight ? "text-white" : "text-foreground"
                  )}>Custom</span>
                )}
              </div>

              <div className={cn(
                "h-px w-full mb-6",
                plan.highlight ? "bg-white/10" : "bg-white/5"
              )} />

              <ul className="space-y-4 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[13px] group/item leading-snug">
                    <Check className={cn(
                      "h-4 w-4 shrink-0 mt-0.5",
                      plan.highlight ? "text-primary" : "text-primary/70"
                    )} />
                    <span className={cn(
                      "font-medium group-hover/item:text-foreground transition-colors",
                      plan.highlight ? "text-slate-300" : "text-muted-foreground"
                    )}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.highlight ? 'default' : 'outline'} 
                className={cn(
                  "w-full rounded-xl h-12 text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:scale-[1.02]",
                  plan.highlight 
                    ? "bg-primary text-white hover:bg-white hover:text-black hover:shadow-primary/20" 
                    : "border-white/10 bg-white/5 text-foreground hover:border-primary hover:text-primary hover:shadow-lg"
                )}
                onClick={() => window.location.href = plan.priceMonthly ? '/book-demo' : '/contact'}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center text-xs text-muted-foreground max-w-2xl mx-auto mb-24 font-medium px-6 py-3 rounded-full border bg-muted/30 inline-block w-full">
          Note: 3rd-party charges (SMS/WhatsApp/Payment Gateway/Maps/GPS) billed separately as per usage.
        </div>

        {/* Plugins Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black tracking-tight mb-4">Plugins & Add-ons</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Extend your ERP with powerful integrations. Pay only for the modules you need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLUGINS.map((plugin) => (
              <div key={plugin.name} className="flex flex-col p-6 rounded-2xl border border-white/10 bg-card hover:bg-muted/20 transition-colors">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h4 className="font-bold text-lg leading-tight">{plugin.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{plugin.description}</p>
                <div className="pt-4 border-t border-border/40 mt-auto">
                  <div className="text-primary font-bold text-sm bg-primary/5 inline-block px-3 py-1 rounded-md">
                    {plugin.pricing}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding Section */}
        <div className="mb-24 bg-slate-900 rounded-[3rem] p-8 md:p-16 text-center border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
          
          <h3 className="text-2xl md:text-3xl font-black text-white mb-6 relative z-10">Transparent Onboarding</h3>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg relative z-10">
            No hidden implementation fees. We charge a one-time fee based on your plan to cover data migration, training, and setup.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto relative z-10">
            {ONBOARDING_FEES.map((fee) => (
              <div key={fee.plan} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">{fee.plan}</div>
                <div className="text-2xl font-black text-white">{fee.fee}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h3 className="text-2xl font-black text-center mb-10">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border border-white/10 bg-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="flex items-center justify-between w-full p-6 text-left font-bold text-lg hover:bg-muted/30 transition-colors"
                >
                  <span className={openFaqIndex === idx ? "text-primary" : "text-foreground"}>
                    {faq.question}
                  </span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="h-5 w-5 text-primary shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                  )}
                </button>
                
                <motion.div
                  initial={false}
                  animate={{ height: openFaqIndex === idx ? "auto" : 0, opacity: openFaqIndex === idx ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-20">
          <p className="text-muted-foreground mb-6 font-medium">Have complex requirements?</p>
          <Button size="lg" className="rounded-full h-14 px-10 text-sm font-black uppercase tracking-widest bg-foreground text-background hover:bg-primary hover:text-white transition-all shadow-xl" onClick={() => window.location.href = '/contact'}>
            Contact Sales Team <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

      </Container>
    </Section>
  );
};

