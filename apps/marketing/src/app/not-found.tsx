"use client";

import React from 'react';
import { Container, Section, Button } from '@schoolerp/ui';
import { motion } from 'framer-motion';
import { MoveLeft, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <Section spacing="none" className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <Container className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 text-primary mb-4">
            <HelpCircle className="w-12 h-12" />
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-foreground leading-none">
            404
          </h1>
          
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Page <span className="text-primary italic">not found</span>.
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto font-medium">
              The page you are looking for doesn't exist or has been moved to a different coordinate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              size="lg" 
              className="rounded-full px-8 font-black uppercase tracking-widest group"
              onClick={() => window.location.href = '/'}
            >
              <MoveLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 font-black uppercase tracking-widest"
              onClick={() => window.location.href = '/contact'}
            >
              Contact Support
            </Button>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
