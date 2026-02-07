"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: "Dr. S. K. Singh",
    role: "Principal, The Heritage School",
    quote: "The multi-language support allowed our staff to transition seamlessly. Fee collection efficiency has increased by 40% in just one term.",
    rating: 5
  },
  {
    name: "Mrs. Anjali Rao",
    role: "Admin Director, Vikas International",
    quote: "Finally, an ERP that doesn't feel like it's from the 90s. The UI is clean, and the manual policy locks have eliminated our audit errors.",
    rating: 5
  },
  {
    name: "Mr. Rajive Gupta",
    role: "Founder, Green Valley Group",
    quote: "The ability to manage multiple branches from a single dashboard has been a game changer for our expansion strategy.",
    rating: 5
  }
];

export const TestimonialSection = () => {
  return (
    <Section className="bg-muted/10 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-x-1/2 pointer-events-none" />
      
      <Container>
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          <div className="text-primary font-black uppercase tracking-widest text-[10px] mb-4">
            Testimonials
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl leading-[0.95]">
            Trusted by the <span className="text-primary italic px-2">visionaries</span> of education.
          </h2>
          <p className="mt-8 text-xl text-muted-foreground font-medium">
            Join the elite circle of educational leaders who have transformed their institutions with SchoolERP.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {REVIEWS.map((review, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col rounded-[2.5rem] border border-white/10 bg-card/60 p-10 shadow-sm backdrop-blur-3xl transition-all duration-500 hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2"
            >
              <div className="flex gap-1 text-primary mb-8">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="flex-grow text-xl font-bold tracking-tight italic text-foreground leading-relaxed">
                "{review.quote}"
              </p>
              <div className="mt-12 flex items-center gap-5 border-t border-white/10 pt-10">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-primary/20">
                  {review.name[0]}
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-foreground tracking-tight">{review.name}</p>
                  <p className="text-xs font-black uppercase tracking-widest text-primary mt-1">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
