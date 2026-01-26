"use client";

import React, { useState } from 'react';
import { Container, Section } from './layout-foundation';
import { ChevronDown } from 'lucide-react';

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
    <Section>
      <Container size="small">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-12 space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden">
              <button 
                onClick={() => setOpenIndex(prev => prev === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-foreground">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="border-t p-6 text-muted-foreground">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
