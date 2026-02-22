"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Container, Section } from './layout-foundation';
import { ChevronRight, Sparkles, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { trackEvent } from '../lib/analytics';

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
          className="max-w-5xl text-5xl font-black tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-[0.95]"
        >
          Run Your School Effortlessly.<br />
          <span className="relative inline-block mt-4 drop-shadow-2xl">
            <span className="relative z-10 bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent italic px-2">
              No Registers, No Errors.
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
          The modern SchoolERP built for Indian schools. 
          <span className="text-foreground"> Fast fee counters</span>, 
          <span className="text-foreground"> instant parent updates</span>, and 
          <span className="text-foreground"> inspection-ready reports</span> with zero manual typing.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 flex flex-col items-center justify-center gap-6"
        >
          <div className="flex flex-col gap-6 sm:flex-row items-center border-red-500">
            <Button size="lg" className="rounded-full px-12 text-lg font-black uppercase tracking-widest transition-all duration-500 group" onClick={() => {
              trackEvent('book_demo_click', { location: 'hero_section' });
              window.location.href = '/book-demo';
            }}>
              Book a 15-Min Demo
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <a href="#features" onClick={() => trackEvent('features_search', { location: 'hero_section' })} className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors px-6 py-3 border-b-2 border-transparent hover:border-primary/50">
              Explore Features →
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-muted-foreground mt-2">
            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Setup in 48 hours</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Mobile-ready for teachers</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> 100% Data Security</span>
          </div>
        </motion.div>

        {/* Realistic Product Mockup Composite */}
        <motion.div 
          initial={{ opacity: 0, y: 60, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 w-full max-w-6xl relative perspective-1000"
        >
          {/* Main Web Dashboard Mockup */}
          <div className="relative z-10 overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card/30 backdrop-blur-3xl shadow-[0_32px_128px_-16px_rgba(139,92,246,0.2)]">
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400/30" />
                <div className="h-3 w-3 rounded-full bg-amber-400/30" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/30" />
              </div>
              <div className="h-4 w-64 rounded-full bg-white/5 mx-auto" />
            </div>
            <div className="aspect-[16/10] relative group">
              <img 
                src="/mockups/admin-web.png" 
                alt="SchoolERP Admin Dashboard" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Floating Mobile App Mockup - Teacher/Admin App */}
          <motion.div
            initial={{ opacity: 0, x: 100, y: -40, rotate: 5 }}
            whileInView={{ opacity: 1, x: 0, y: 0, rotate: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 1.4, type: 'spring' }}
            className="absolute -right-8 -bottom-12 z-20 w-[280px] hidden lg:block"
          >
            <div className="relative aspect-[9/19.5] drop-shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
              {/* Screen Content */}
              <div className="absolute inset-[3%] rounded-[2rem] overflow-hidden bg-black">
                 <img 
                  src="/mockups/attendance-live.png" 
                  alt="SchoolERP Teacher App" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Device Frame */}
              <img 
                src="/mockups/mobile-frame.jpg" 
                alt="Mobile Frame" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen brightness-150"
              />
            </div>
          </motion.div>

          {/* Floating Mobile App Mockup - Parent Portal */}
          <motion.div
            initial={{ opacity: 0, x: -100, y: 40, rotate: -10 }}
            whileInView={{ opacity: 1, x: 0, y: 0, rotate: 5 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 1.6, type: 'spring' }}
            className="absolute -left-12 bottom-12 z-20 w-[240px] hidden lg:block"
          >
            <div className="relative aspect-[9/19.5] drop-shadow-[0_24px_48px_rgba(139,92,246,0.2)] scale-90">
              {/* Screen Content */}
              <div className="absolute inset-[3%] rounded-[2rem] overflow-hidden bg-black">
                 <img 
                  src="/mockups/notice-mobile-live.png" 
                  alt="SchoolERP Parent Portal" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Device Frame */}
              <img 
                src="/mockups/mobile-frame.jpg" 
                alt="Mobile Frame" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen brightness-150"
              />
            </div>
          </motion.div>

          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />
        </motion.div>
      </Container>
    </Section>
  );
};
