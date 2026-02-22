import React from 'react';
import { Container } from './layout-foundation';
import { Landmark, Github, Twitter, Linkedin } from 'lucide-react';

const FOOTER_LINKS = [
  {
    title: 'Product Features',
    links: [
      { label: 'Fee Management Software', href: '/features/school-fee-management-software' },
      { label: 'Attendance Management', href: '/features/school-attendance-management-system' },
      { label: 'Report Card Generator', href: '/features/report-card-software-for-schools' },
      { label: 'Parent Communication App', href: '/features/school-parent-communication-app' },
      { label: 'Admission Enquiry Pipeline', href: '/features/enquiry-follow-up-pipeline' },
      { label: 'Integrations', href: '/integrations' },
    ],
  },
  {
    title: 'Solutions (Use Cases)',
    links: [
      { label: 'Reduce Fee Defaulters', href: '/use-cases/fees-collection-and-defaulters' },
      { label: 'Stop WhatsApp Chaos', href: '/use-cases/reduce-whatsapp-chaos' },
      { label: 'Inspection Ready Reports', href: '/use-cases/office-reports-for-inspection' },
      { label: 'Print Certificates in 1-Click', href: '/use-cases/certificates-in-one-click' },
      { label: 'Roadmap & Future', href: '/roadmap' },
    ],
  },
  {
    title: 'Resources & Company',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'About Us', href: '/about' },
      { label: 'Blog & Insights', href: '/blog' },
      { label: 'Templates Hub', href: '/resources' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Connect & Legal',
    links: [
      { label: 'Partners', href: '/partners' },
      { label: 'Client Reviews', href: '/reviews' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Security Policy', href: '/legal/security' },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-slate-950 pb-12 pt-32 text-slate-400">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <a href="/" className="flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Landmark className="h-7 w-7" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">
                School<span className="text-primary px-0.5">ERP</span>
              </span>
            </a>
            <p className="mt-8 max-w-xs text-lg font-medium leading-relaxed text-slate-400/80">
              The high-performance operating system for the next generation of educational excellence.
            </p>
            <div className="mt-10 flex gap-6">
              {[
                { icon: Twitter, href: '#' },
                { icon: Linkedin, href: '#' },
                { icon: Github, href: '#' },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 transition-all hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-1"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3 lg:col-span-8">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8">
                  {group.title}
                </h3>
                <ul className="space-y-4">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a 
                        href={link.href} 
                        className="text-sm font-bold transition-all hover:text-primary hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-32 border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-black uppercase tracking-widest text-slate-500">
          <p>© {new Date().getFullYear()} School ERP Inc. Engineered with Precision.</p>
          <div className="flex gap-8">
            <a href="/legal/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="/legal/terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="/security" className="hover:text-primary transition-colors">Security</a>
          </div>
        </div>
      </Container>
    </footer>
  );
};
