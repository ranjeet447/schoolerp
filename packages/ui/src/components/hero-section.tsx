"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Container, Section } from './layout-foundation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const HeroSection = () => {
  return (
    <Section spacing="none" className="relative overflow-hidden bg-background pt-20 pb-16 lg:pb-0 lg:h-[calc(100vh-80px)] flex items-center">
      {/* Dynamic background elements */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-1/4 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-0 right-1/4 translate-y-1/2 w-[600px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" 
      />
      
      <Container className="relative z-10 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary mb-6 backdrop-blur-md shadow-lg shadow-primary/5"
        >
          <Sparkles className="h-3 w-3 fill-primary animate-pulse" />
          <span>Version 5.0 Vision is live</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl text-5xl font-black tracking-tight text-slate-900 sm:text-7xl leading-[1.05]"
        >
          The Operating System <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              for Modern Education
            </span>
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed"
        >
          A comprehensive school operating system managing Academics, Finance, and Safety. 
          Audit-grade controls meet a premium experience.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row"
        >
          <Button size="lg" className="rounded-full px-8 text-base shadow-xl shadow-primary/20 hover:scale-105 transition-transform" onClick={() => window.location.href = '/book-demo'}>
            Book a Demo
          </Button>
        </motion.div>

        {/* Abstract UI Mockup with Floating Elements - Scaled Down */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-12 w-full max-w-4xl overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-xl shadow-2xl relative group transform-gpu"
        >
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-3 rounded-xl border bg-background/40 p-4 shadow-sm">
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                <div className="flex items-end gap-2">
                  <div className="h-8 w-20 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary">₹ 45L</div>
                </div>
                <div className="h-24 w-full rounded-lg bg-gradient-to-b from-muted/30 to-muted/10 border" />
              </div>
              <div className="col-span-2 space-y-3 rounded-xl border bg-background/40 p-4 shadow-sm">
                <div className="flex justify-between">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="h-3 w-12 rounded bg-muted" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="w-full h-16 rounded-t-lg bg-primary/15" />
                      <div className="h-1.5 w-full rounded bg-muted/40" />
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

