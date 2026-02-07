import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import { cn } from '@schoolerp/ui';

export const metadata: Metadata = {
  title: 'About Us - School ERP',
  description: 'Our mission to digitize 10,000 schools in India.',
};

export default function AboutPage() {
  return (
    <main>
      <Section className="bg-muted/10 pt-32">
        <Container className="text-center max-w-4xl">
          <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-8">
            The Manifesto
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground sm:text-8xl leading-[0.9]">
            Engineered for <br />
            <span className="text-primary italic px-3">educational</span> excellence.
          </h1>
          <p className="mt-12 text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
            We are building the high-performance operating system for schools that refuse to settle for mediocrity.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="space-y-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-10">
               <h2 className="text-4xl font-black tracking-tight leading-tight">Software that feels like <span className="text-primary">magic</span>, runs like clockwork.</h2>
               <div className="space-y-6 text-xl text-muted-foreground font-medium leading-relaxed">
                  <p>
                    SchoolERP was born out of a stark observation: Schools are building the human capital of tomorrow, 
                    but they are running on the infrastructure of yesterday.
                  </p>
                  <p>
                    We saw visionaries drowning in spreadsheets and legacy systems that actively slowed them down. 
                    We decided to build something better. A platform that is as powerful as it is intuitive.
                  </p>
               </div>
            </div>
            
            <div className="relative aspect-[4/3] rounded-[3rem] bg-slate-950 shadow-3xl overflow-hidden border border-white/10 p-12">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-fuchsia-500/10" />
               <div className="relative z-10 h-full flex flex-col justify-center gap-10">
                  {[
                    { label: 'Latency', value: '12ms', color: 'text-emerald-400' },
                    { label: 'Uptime', value: '99.99%', color: 'text-primary' },
                    { label: 'Execution', value: 'Atomic', color: 'text-fuchsia-400' }
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col border-l-2 border-white/10 pl-8">
                       <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">{stat.label}</span>
                       <span className={cn("text-5xl font-black tracking-tighter italic", stat.color)}>{stat.value}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
             {[
               { value: '120+', label: 'Visionary Schools' },
               { value: '50k+', label: 'Elite Students' },
               { value: '₹200Cr+', label: 'Flow Managed' }
             ].map((stat, i) => (
               <div key={i} className="group rounded-[3rem] border border-white/10 bg-card/50 p-12 text-center backdrop-blur-xl hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5">
                 <div className="text-6xl font-black tracking-tighter text-primary italic mb-4 group-hover:scale-110 transition-transform">
                   {stat.value}
                 </div>
                 <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                   {stat.label}
                 </div>
               </div>
             ))}
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
