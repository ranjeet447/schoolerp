import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import { Briefcase, MapPin, Users, Heart } from 'lucide-react';

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
      <div className="pt-24 pb-12 bg-muted/20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Join the Mission</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          We are a team of educators and engineers passionate about scaling impact.
        </p>
      </div>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Why work with us?</h2>
              <div className="grid gap-6">
                <div className="flex gap-4">
                   <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                     <Heart className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="font-bold">Impact First</p>
                     <p className="text-sm text-muted-foreground">Your code will directly improve the lives of thousands of teachers and students.</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                     <Users className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="font-bold">A-Player Culture</p>
                     <p className="text-sm text-muted-foreground">Work with the best engineers from top Indian tech companies.</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Open Roles</h2>
              <div className="space-y-4">
                {JOBS.map((job, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border p-6 hover:border-primary/50 transition-colors">
                    <div>
                      <h4 className="font-bold">{job.title}</h4>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.team}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                      </div>
                    </div>
                    <button className="text-sm font-bold text-primary">Apply &rarr;</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
