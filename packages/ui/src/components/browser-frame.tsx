'use client';

import React from 'react';
import { cn } from '../lib/utils';

interface BrowserFrameProps {
  src: string;
  alt: string;
  className?: string;
}

export const BrowserFrame = ({ src, alt, className }: BrowserFrameProps) => {
  return (
    <div className={cn("rounded-xl border bg-card shadow-2xl overflow-hidden group", className)}>
      {/* Browser Header */}
      <div className="bg-muted px-4 py-3 border-b flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-inner" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-inner" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-inner" />
        </div>
        <div className="mx-auto bg-background/50 text-[11px] font-medium px-12 py-1 rounded border border-input text-muted-foreground/60 select-none hidden sm:block">
          schoolerp-platform.app
        </div>
        <div className="w-12 ml-auto" /> {/* Balance */}
      </div>
      
      {/* Page Content */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 italic flex items-center justify-center">
        <img 
          src={src} 
          alt={alt} 
          className="object-cover object-top w-full h-full transform group-hover:scale-[1.02] transition-transform duration-1000 ease-in-out" 
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/1440x900?text=Screenshot+Found+Soon';
          }}
        />
        
        {/* Subtle Overlay Shadow */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/20 z-10" />
      </div>
    </div>
  );
};

export const MobileFrame = ({ src, alt, className }: BrowserFrameProps) => {
  return (
    <div className={cn("relative mx-auto border-[8px] border-slate-900 rounded-[3rem] h-[580px] w-[270px] bg-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden ring-4 ring-slate-800", className)}>
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-7 bg-slate-900 flex justify-center items-end pb-1.5 z-20">
        <div className="w-20 h-4 bg-slate-800 rounded-full" />
      </div>
      
      {/* Content */}
      <div className="h-full w-full bg-white rounded-[2.5rem] overflow-hidden relative">
        <img 
          src={src} 
          alt={alt} 
          className="object-cover object-top w-full h-full" 
          loading="lazy" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/390x844?text=Mobile+App';
          }}
        />
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-2 inset-x-0 h-1.5 w-24 bg-slate-800/80 mx-auto rounded-full z-20" />
    </div>
  );
};
