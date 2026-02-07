"use client";

import React from 'react';
import { Button } from './button';
import { ArrowRight, ExternalLink, Landmark } from 'lucide-react';

interface IntegrationCardProps {
  name: string;
  category: string;
  description: string;
  logoUrl?: string;
  status?: 'active' | 'beta' | 'planned';
  slug: string;
}

export const IntegrationCard = ({ 
  name, 
  category, 
  description, 
  logoUrl, 
  status,
  slug 
}: IntegrationCardProps) => {
  return (
    <div 
      className="group relative flex h-full flex-col rounded-[2rem] border border-white/10 bg-card/40 p-10 backdrop-blur-3xl transition-all duration-500 hover:shadow-3xl hover:shadow-primary/20 hover:border-primary/40 hover:-translate-y-2 overflow-hidden cursor-pointer"
      onClick={() => window.location.href = `/integrations/${slug}`}
    >
      {/* Corner Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-2xl shadow-black/5 p-3 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 border border-slate-100">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
            ) : (
              <Landmark className="h-8 w-8 text-primary" />
            )}
          </div>
          {status && (
            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-500/20">
              Live
            </div>
          )}
        </div>
        
        <div>
          <div className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 px-1">
            {category}
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>

        <p className="text-muted-foreground font-medium leading-relaxed text-sm line-clamp-3">
          {description}
        </p>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary opacity-40 group-hover:opacity-100 transition-all duration-300">
          Connect <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
        </div>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20">
          <ExternalLink className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
