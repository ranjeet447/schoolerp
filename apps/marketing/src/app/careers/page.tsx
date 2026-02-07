import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import { Briefcase, MapPin, Users, Heart, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers - School ERP',
  description: 'Join the team building the future of Indian education.',
};

const JOBS = [
  { title: 'Senior Software Engineer', team: 'Platform Engineering', location: 'Remote / Gurgaon' },
  { title: 'Product Designer (UX)', team: 'Design', location: 'Remote' },
  { title: 'Growth Manager', team: 'Sales', location: 'Mumbai' },
  { title: 'Customer Success Lead', team: 'Operations', location: 'Gurgaon' },
];

export default function CareersPage() {
  return (
    <main>
      <Section className="bg-muted/10 pt-32">
        <Container className="text-center max-w-4xl">
          <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-8">
            Careers
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground sm:text-8xl leading-[0.9]">
            Join the <br />
            <span className="text-primary italic px-3">Elite</span> Guard.
          </h1>
          <p className="mt-12 text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
            We are a high-speed team of educators and engineers obsessed with scaling educational impact through precision engineering.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-24 lg:grid-cols-2">
            <div className="space-y-12">
              <h2 className="text-4xl font-black tracking-tight">Why work with the <br /><span className="text-primary italic">Precision</span> Team?</h2>
              <div className="space-y-8">
                {[
                  { icon: Heart, title: 'Impact First', desc: 'Your code will directly optimize the educational outcomes of thousands.' },
                  { icon: Users, title: 'A-Player Culture', desc: 'Work alongside architects from the most successful Indian tech startups.' },
                  { icon: Briefcase, title: 'Radical Autonomy', desc: 'We value owners over operators. You lead the domain you manage.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="shrink-0 rounded-2xl bg-primary shadow-lg shadow-primary/20 p-3.5 text-white group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-foreground tracking-tight">{item.title}</p>
                      <p className="mt-2 text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-10">
              <h2 className="text-4xl font-black tracking-tight">Open <span className="text-primary italic">Missions</span></h2>
              <div className="space-y-6">
                {JOBS.map((job, i) => (
                  <div 
                    key={i} 
                    className="group relative flex items-center justify-between rounded-[2rem] border border-white/10 bg-card/60 p-8 hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 backdrop-blur-3xl overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[3rem] group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="relative z-10">
                      <h4 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{job.title}</h4>
                      <div className="mt-3 flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1 rounded-lg">
                          <Briefcase className="h-3 w-3" /> {job.team}
                        </span>
                        <span className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1 rounded-lg">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                      </div>
                    </div>
                    <button className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-all active:scale-95">
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="rounded-[2.5rem] border-2 border-dashed border-white/10 p-10 text-center">
                 <p className="text-sm font-bold text-muted-foreground italic">Don't see a perfect match? Send us your manifesto at</p>
                 <a href="mailto:talent@schoolerp.com" className="mt-2 inline-block text-lg font-black text-primary hover:underline">talent@schoolerp.com</a>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
