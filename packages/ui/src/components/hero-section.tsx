"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Container, Section } from './layout-foundation';
import { ChevronRight, Sparkles, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { trackEvent } from '../lib/analytics';
import { BrowserFrame, MobileFrame } from './browser-frame';

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
          <span>School ERP for India (2025-2026)</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl text-5xl font-black tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-[0.95]"
        >
          School Fee Collection, Parent Communication, Attendance & Exams.<br />
          <span className="relative inline-block mt-4 drop-shadow-2xl">
            <span className="relative z-10 bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent italic px-2">
              One School ERP. Less Manual Work.
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
          School ERP software built for Indian schools with 
          <span className="text-foreground"> online fee collection & dues management</span>, 
          <span className="text-foreground"> parent app updates</span>, 
          <span className="text-foreground"> attendance management</span>, and 
          <span className="text-foreground"> exam results & report cards</span>.
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
            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> UPI fee receipts & dues reminders</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Parent app real-time updates</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Biometric-ready attendance support</span>
          </div>
        </motion.div>

        {/* Realistic Product Mockup Composite */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 100 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-28 w-full max-w-7xl relative"
        >
          {/* Main Web Dashboard Mockup */}
          <div className="relative z-10 mx-auto px-4 lg:px-0">
             <BrowserFrame 
                src="/product-screens/admin/admin-dashboard.png" 
                alt="SchoolERP Platform Dashboard"
                className="shadow-[0_48px_128px_-16px_rgba(139,92,246,0.3)]"
             />
          </div>

          {/* Floating Mobile Feature */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 12 }}
            whileInView={{ opacity: 1, x: 0, rotate: -6 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 1.2, type: 'spring' }}
            className="absolute -right-4 md:-right-12 bottom-0 md:-bottom-24 z-20 scale-75 md:scale-100 hidden sm:block"
          >
            <MobileFrame 
              src="/product-screens/teacher/teacher-dashboard-mobile.png" 
              alt="Teacher Mobile Dashboard" 
            />
          </motion.div>

          {/* Floating Accountant View */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -12 }}
            whileInView={{ opacity: 1, x: 0, rotate: 6 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 1.4, type: 'spring' }}
            className="absolute -left-12 bottom-12 z-20 hidden lg:block"
          >
             <div className="w-96 rounded-2xl border bg-card/60 backdrop-blur-3xl p-4 shadow-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Instant Finance Intelligence</p>
                <img src="/product-screens/accountant/accountant-dashboard.png" className="rounded-xl border shadow-sm" alt="Accountant view" />
             </div>
          </motion.div>

          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Carousel-like Dashboard Thumbnails */}
          <div className="mt-20 mx-auto max-w-4xl">
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { label: 'Accountant', img: '/product-screens/accountant/accountant-dashboard.png' },
                { label: 'Teacher', img: '/product-screens/teacher/teacher-dashboard.png' },
                { label: 'Parent', img: '/product-screens/parent/parent-dashboard.png' },
                { label: 'Student', img: '/product-screens/student/student-dashboard.png' },
              ].map((thumb, i) => (
                <motion.div
                  key={thumb.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                  className="group relative cursor-pointer"
                  onClick={() => window.location.href = '/product'}
                >
                  <div className="w-48 aspect-video overflow-hidden rounded-xl border bg-card transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:border-primary/50">
                     <img src={thumb.img} alt={thumb.label} className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center transition-colors group-hover:text-primary">{thumb.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
};
