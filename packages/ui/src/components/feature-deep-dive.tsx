import React from 'react';
import { Container, Section } from './layout-foundation';
import { Check } from 'lucide-react';

interface FeatureModuleProps {
  title: string;
  description: string;
  benefits: string[];
  imageSide?: 'left' | 'right';
  badge: string;
}

export const FeatureDeepDive = ({ 
  title, 
  description, 
  benefits, 
  imageSide = 'right',
  badge
}: FeatureModuleProps) => {
  return (
    <Section spacing="large" className="overflow-hidden border-b border-white/5">
      <Container>
        <div className={`flex flex-col gap-16 lg:items-center ${imageSide === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          
          <div className="flex-1 space-y-10">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
              {badge}
            </div>
            <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl leading-[0.95]">
              {title}
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              {description}
            </p>
            <ul className="space-y-6">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-lg font-bold text-foreground/80 group-hover:text-primary transition-colors">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1">
            <div className="relative aspect-square w-full overflow-hidden rounded-[3rem] border border-white/10 bg-slate-950 shadow-3xl">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-600/10 opacity-50" />
              
              <div className="absolute inset-x-8 top-8 bottom-0 flex flex-col items-center">
                 {/* Internal UI Mockup */}
                 <div className="w-full h-full bg-slate-900/80 backdrop-blur-3xl rounded-t-[2rem] border-x border-t border-white/10 p-8 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                       <div className="flex gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500/20" />
                          <div className="h-3 w-3 rounded-full bg-amber-500/20" />
                          <div className="h-3 w-3 rounded-full bg-emerald-500/20" />
                       </div>
                       <div className="h-2 w-32 rounded-full bg-white/5" />
                    </div>
                    
                    <div className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/20 animate-pulse" />
                          <div className="space-y-2 flex-1">
                             <div className="h-2 w-1/3 rounded bg-white/10" />
                             <div className="h-2 w-1/4 rounded bg-white/5" />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
                          <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
                       </div>
                       
                       <div className="space-y-3">
                          <div className="h-2 w-full rounded bg-white/5" />
                          <div className="h-2 w-full rounded bg-white/5" />
                          <div className="h-2 w-2/3 rounded bg-white/5" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </Section>
  );
};
