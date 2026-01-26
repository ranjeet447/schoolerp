"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { IconMapper } from './icon-mapper';

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  slug: string;
  [key: string]: any;
}

interface FeatureCarouselProps {
  slides: Slide[];
}

export const FeatureCarousel = ({ slides }: FeatureCarouselProps) => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-[3rem] bg-card border shadow-2xl">
      <div className="relative h-[500px] flex items-center justify-center p-8 md:p-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className={cn(
                "inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-xl mb-4",
                slides[current].color
              )}>
                <IconMapper name={slides[current].icon} size={32} />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tight">{slides[current].title}</h3>
              <p className="text-xl text-muted-foreground leading-relaxed italic">
                "{slides[current].description}"
              </p>
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="rounded-full px-8 gap-2 group"
                  onClick={() => window.location.href = `/features/${slides[current].slug}`}
                >
                  Explore Details
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            <div className="flex-1 hidden md:block">
              {/* Mock UI snippet relative to the feature */}
              <div className="w-full aspect-video rounded-2xl bg-muted/50 border-2 border-dashed border-muted flex items-center justify-center text-muted-foreground font-mono text-sm">
                [ {slides[current].title} Mock UI ]
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
        <button 
          onClick={prev}
          className="h-10 w-10 rounded-full border bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                current === i ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <button 
          onClick={next}
          className="h-10 w-10 rounded-full border bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
