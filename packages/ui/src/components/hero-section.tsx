"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Container, Section } from './layout-foundation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const HeroSection = () => {
  return (
    <Section spacing="none" className="relative overflow-hidden bg-background pt-32 pb-20 lg:pt-48 lg:pb-32 lg:min-h-screen flex items-center">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
            x: [0, 20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/30 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/20 blur-[120px] rounded-full" 
        />
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      <Container className="relative z-10 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-10 backdrop-blur-xl shadow-2xl shadow-primary/20"
        >
          <Sparkles className="h-4 w-4 fill-primary animate-pulse" />
          <span>Next-Gen Enterprise Education</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl text-6xl font-black tracking-tight text-foreground sm:text-8xl lg:text-9xl leading-[0.95]"
        >
          Modernize Your <br />
          <span className="relative inline-block mt-4 drop-shadow-2xl">
            <span className="relative z-10 bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent italic px-2">
              Education
            </span>
            <div className="absolute -bottom-2 left-0 right-0 h-4 bg-primary/20 blur-2xl -rotate-1" />
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 max-w-2xl text-xl md:text-2xl text-muted-foreground/80 leading-relaxed font-medium"
        >
          The all-in-one operating system for schools that value 
          <span className="text-foreground"> safety</span>, 
          <span className="text-foreground"> speed</span>, and 
          <span className="text-foreground"> precision</span>.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 flex flex-col gap-6 sm:flex-row items-center justify-center"
        >
          <Button size="lg" className="rounded-full px-12 text-lg font-black uppercase tracking-widest transition-all duration-500 group" onClick={() => window.location.href = '/book-demo'}>
            Book a Demo
            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <a href="/features" className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors px-6 py-3 border-b-2 border-transparent hover:border-primary/50">
            Explore Features →
          </a>
        </motion.div>

        {/* Abstract UI Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 60, rotateX: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card/30 backdrop-blur-3xl shadow-[0_32px_128px_-16px_rgba(139,92,246,0.3)] relative group transform-gpu perspective-1000"
        >
          <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/50" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
              <div className="h-3 w-3 rounded-full bg-green-500/50" />
            </div>
          </div>
          <div className="p-6 sm:p-8 md:p-12">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-3">
              <div className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-4 sm:p-6 shadow-2xl">
                <div className="h-4 w-24 rounded-full bg-primary/20" />
                <div className="flex items-end gap-2 pt-2">
                  <div className="text-3xl sm:text-4xl font-black text-primary italic">₹72.4L</div>
                </div>
                <div className="h-32 w-full rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-white/10" />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-4 rounded-3xl border border-white/5 bg-white/5 p-4 sm:p-6 shadow-2xl">
                <div className="flex justify-between items-center px-1 sm:px-2">
                  <div className="h-4 w-32 sm:w-48 rounded-full bg-white/10" />
                  <div className="h-4 w-12 sm:w-16 rounded-full bg-white/10" />
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${[60, 90, 40, 75][i]}%` }}
                        transition={{ duration: 1, delay: 1.2 + i * 0.1 }}
                        className="w-full rounded-t-xl bg-gradient-to-t from-primary/40 to-primary/10" 
                      />
                      <div className="h-2 w-full rounded-full bg-white/5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
};
