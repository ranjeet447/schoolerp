"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Container, Section } from './layout-foundation';

export const FinalCTA = () => {
  return (
    <Section spacing="none" className="pb-32">
      <Container>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[3rem] bg-slate-900 px-10 py-24 text-center text-white shadow-3xl lg:px-24"
        >
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 blur-[120px] rounded-full translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/2 h-full bg-violet-600/30 blur-[120px] rounded-full -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-5xl font-black tracking-tighter sm:text-8xl leading-[0.9]">
              Ready to <br />
              <span className="italic bg-gradient-to-r from-primary via-violet-400 to-fuchsia-400 bg-clip-text text-transparent px-2">transform</span> your school?
            </h2>
            <p className="mt-12 mx-auto max-w-2xl text-xl md:text-2xl font-medium text-slate-300/80 leading-relaxed">
              Join hundreds of progressive schools across India that have already modernized their operations with SchoolERP.
            </p>
            <div className="mt-16 flex flex-col gap-6 sm:flex-row justify-center">
              <Button size="lg" className="rounded-full px-12 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300" onClick={() => window.location.href = '/book-demo'}>
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/10 bg-white/5 px-12 text-lg font-black uppercase tracking-widest backdrop-blur-xl hover:bg-white/10" onClick={() => window.location.href = '/contact'}>
                Contact Sales
              </Button>
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all">
              <div className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Trusted by</div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="h-6 w-auto text-xl font-black italic">ISB</div>
              <div className="h-6 w-auto text-xl font-black italic">DPS</div>
              <div className="h-6 w-auto text-xl font-black italic">KVS</div>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
};
