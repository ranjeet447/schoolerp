"use client";

import React, { useEffect } from 'react';
import { Container, Section, Button } from '@schoolerp/ui';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section spacing="none" className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[120px] rounded-full" />
      </div>

      <Container className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-red-500/10 text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
              Something went <span className="text-red-500 italic">wrong</span>.
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto font-medium">
              We encountered an unexpected error. Our engineers have been notified and are investigating.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground/50 pt-4 cursor-default select-none">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button 
              size="lg" 
              className="rounded-full px-8 font-black uppercase tracking-widest group bg-red-600 hover:bg-red-700 text-white border-red-600"
              onClick={() => reset()}
            >
              <RefreshCcw className="mr-2 h-5 w-5 transition-transform group-hover:rotate-180 duration-500" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 font-black uppercase tracking-widest"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
