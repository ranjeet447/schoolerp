"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const FAQS = [
  {
    q: "How long does onboarding take?",
    a: "Standard onboarding for a single school takes 3-5 business days, including data migration and staff training."
  },
  {
    q: "Is our data safe and private?",
    a: "Yes. We use enterprise-grade encryption and individual tenant isolation. We never sell school or student data."
  },
  {
    q: "Do you support regional languages?",
    a: "Absolutely. Our platform is built for India and supports Hindi, Marathi, Telugu, and 10+ other languages."
  },
  {
    q: "Can we migrate our existing data?",
    a: "Yes, our team handles bulk migration from your existing Excel files or legacy ERP systems at no extra cost."
  },
  {
    q: "What are the messaging costs?",
    a: "Transactional emails and in-app alerts are free. External SMS and WhatsApp alerts are charged at actual carrier rates without markup."
  }
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section className="bg-background">
      <Container size="small">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="text-primary font-black uppercase tracking-widest text-[10px] mb-4">
            Support
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl leading-[0.95]">
            Got <span className="italic">questions</span>? <br />
            We've got <span className="text-primary px-2">answers</span>.
          </h2>
        </div>
        
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <motion.div 
              key={i} 
              initial={false}
              className={cn(
                "rounded-[2rem] border transition-all duration-300 overflow-hidden",
                openIndex === i 
                  ? "border-primary bg-primary/5 shadow-2xl shadow-primary/5" 
                  : "border-white/10 bg-card/50 hover:border-primary/30"
              )}
            >
              <button 
                onClick={() => setOpenIndex(prev => prev === i ? null : i)}
                className="flex w-full items-center justify-between p-8 text-left"
              >
                <span className={cn(
                  "text-lg font-bold tracking-tight transition-colors",
                  openIndex === i ? "text-primary" : "text-foreground"
                )}>
                  {faq.q}
                </span>
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                  openIndex === i ? "bg-primary text-white rotate-180" : "bg-muted/50 text-muted-foreground"
                )}>
                  <ChevronDown className="h-5 w-5" />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="px-8 pb-8 text-muted-foreground font-medium leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
