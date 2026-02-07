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
      <div className="pt-32 pb-12 bg-primary text-primary-foreground text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Enterprise Trust</h1>
        <p className="mt-4 text-xl opacity-90 mx-auto max-w-2xl">
          Security is not a feature for us; it is our foundation.
        </p>
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
