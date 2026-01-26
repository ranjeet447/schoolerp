"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Container, Section } from './layout-foundation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const HeroSection = () => {
  return (
    <Section spacing="large" className="relative overflow-hidden bg-background">
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
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8"
        >
          <Sparkles className="h-4 w-4 fill-primary" />
          <span>Version 5.0 Vision is live</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl text-5xl font-extrabold tracking-tight text-foreground sm:text-8xl"
        >
          The Operating System for <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Modern Education
            </span>
            <motion.span 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: 1 }}
              className="absolute bottom-2 left-0 h-3 bg-primary/10 -z-0"
            />
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10 max-w-2xl text-xl text-muted-foreground leading-relaxed"
        >
          A comprehensive school operating system managing Academics, Finance, and Safety. 
          Audit-grade controls meet a premium experience.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 flex flex-col gap-4 sm:flex-row"
        >
          <Button size="lg" className="rounded-full px-10 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform" onClick={() => window.location.href = '/book-demo'}>
            Book a Demo
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-10 text-lg hover:bg-primary/5 transition-colors" onClick={() => window.location.href = '/roadmap'}>
            View Roadmap
          </Button>
        </motion.div>

        {/* Abstract UI Mockup with Floating Elements */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-24 w-full max-w-5xl overflow-hidden rounded-3xl border bg-card/50 backdrop-blur-xl shadow-2xl relative group"
        >
          <div className="flex items-center gap-2 border-b bg-muted/40 px-6 py-4">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400/80 shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/80 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
              <div className="h-3 w-3 rounded-full bg-green-400/80 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
            </div>
            <div className="mx-auto rounded-full bg-background/50 border px-10 py-1.5 text-xs font-medium text-muted-foreground tracking-wide">
              school-erp.com/dashboard
            </div>
          </div>
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <motion.div 
                whileHover={{ y: -5 }}
                className="space-y-4 rounded-2xl border bg-background/40 p-6 shadow-sm"
              >
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                <div className="flex items-end gap-2">
                  <div className="h-12 w-24 rounded-xl bg-primary/20 font-bold text-primary flex items-center justify-center text-xl tracking-tighter">₹ 45L</div>
                  <div className="h-5 w-14 rounded-full bg-green-400/20 text-[10px] text-green-600 font-bold flex items-center justify-center">+12%</div>
                </div>
                <div className="h-36 w-full rounded-xl bg-gradient-to-b from-muted/30 to-muted/10 border" />
              </motion.div>
              <motion.div 
                whileHover={{ y: -5 }}
                className="col-span-2 space-y-4 rounded-2xl border bg-background/40 p-6 shadow-sm"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-40 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: [40, 80, 60, 100][i] }}
                        className="w-full rounded-t-xl bg-primary/15 group-hover:bg-primary/25 transition-colors" 
                      />
                      <div className="h-2 w-full rounded bg-muted/40" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Trust Strip */}
        <div className="mt-32 w-full border-y border-muted/30 py-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-10">Trusted by elite schools across India</p>
          <div className="flex flex-wrap justify-center gap-x-16 gap-y-10 opacity-30 invert dark:invert-0">
            <span className="text-3xl font-black tracking-tighter">THE HERITAGE</span>
            <span className="text-3xl font-black tracking-tighter">VIKAS INT.</span>
            <span className="text-3xl font-black tracking-tighter">DPS GROUP</span>
            <span className="text-3xl font-black tracking-tighter">K V GROUP</span>
          </div>
        </div>
      </Container>
    </Section>
  );
};

