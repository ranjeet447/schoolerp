import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import { ShieldCheck, Lock, EyeOff, Server, Terminal, FileCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Compliance - School ERP',
  description: 'Enterprise-grade security for your school data.',
};

const SECURITY_FEATURES = [
  {
    title: "Data Encryption",
    description: "All data is encrypted at rest using AES-256 and in transit via TLS 1.3.",
    icon: Lock
  },
  {
    title: "SOC2 Compliance",
    description: "Our infrastructure and processes are built to meet SOC2 Type II standards.",
    icon: FileCheck
  },
  {
    title: "Individual Tenant Isolation",
    description: "Your data is stored in isolated databases. No data leakage between schools.",
    icon: ShieldCheck
  },
  {
    title: "Audit Logs",
    description: "Every single change to sensitive data is logged with user IP and timestamp.",
    icon: Terminal
  },
  {
    title: "Zero-Knowledge Access",
    description: "Even our developers cannot see your PII without explicit admin approval.",
    icon: EyeOff
  },
  {
    title: "Global CDN & Backups",
    description: "Point-in-time recovery and real-time backups across multiple geo-regions.",
    icon: Server
  }
];

export default function SecurityPage() {
  return (
    <main>
      <div className="relative pt-32 pb-20 overflow-hidden bg-muted/20 text-center">
        {/* Ambient Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 container">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-8 backdrop-blur-xl shadow-lg">
             <ShieldCheck className="h-4 w-4" />
             Bank-Grade Protection
          </div>
          <h1 className="text-4xl font-black tracking-tighter sm:text-7xl mb-6">
            Uncompromising <br /><span className="text-primary italic">Security</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium mx-auto max-w-2xl leading-relaxed">
            We treat your school's data with the same rigor as a financial institution. <br />
            ISO 27001 certified processes and SOC2 Type II compliant infrastructure.
          </p>
        </div>
      </div>

      <Section>
        <Container>
          <div className="grid gap-12 md:grid-cols-3">
            {SECURITY_FEATURES.map((feature, i) => (
              <div key={i} className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-24 rounded-[2rem] border bg-muted/30 p-12 text-center">
            <h2 className="text-3xl font-bold">Have a security inquiry?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our security team is ready to provide penetration test reports and architecture diagrams for your IT audits.
            </p>
            <a href="mailto:security@schoolerp.com" className="mt-8 inline-block text-xl font-bold text-primary hover:underline">
              security@schoolerp.com &rarr;
            </a>
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
