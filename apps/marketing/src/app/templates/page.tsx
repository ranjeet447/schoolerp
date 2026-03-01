import React from 'react';
import { Container, Section, FinalCTA, TEMPLATES_DATA, Breadcrumbs } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Download, FileText, Sparkles, Filter, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'School Templates & Formats for Indian Schools | SchoolERP',
  description: 'Download 20+ ready-to-use school templates including admission forms, TCs, fee receipts, and board-compliant report cards.',
  alternates: {
    canonical: 'https://schoolerp.com/templates',
  }
};

export default function TemplatesListingPage() {
  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'admin', label: 'Admin' },
    { id: 'finance', label: 'Fees & Dues' },
    { id: 'academics', label: 'Academics' },
    { id: 'hr', label: 'HR' },
    { id: 'communication', label: 'Parent Communication' },
  ];

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Hero Section */}
      <div className="relative pt-40 pb-24 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
        
        <Container className="relative z-10">
          <Breadcrumbs items={[{ label: 'Templates' }]} />
          
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary mb-8 shadow-sm">
              <FileText className="h-4 w-4" /> Professional Assets
            </div>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-[0.9] mb-8 bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              Ready-to-Use <br className="hidden md:block" /> School Templates
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium mx-auto max-w-2xl leading-relaxed">
              Skip the paperwork. Download verified formats for admissions, fees & dues, parent communication, and human resources.
            </p>
          </div>
        </Container>
      </div>

      {/* Grid Section */}
      <Section className="bg-muted/30 py-24 border-y border-border/50">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button 
                  key={cat.id} 
                  className={`text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-2xl transition-all border shrink-0 ${
                    cat.id === 'all'
                      ? 'bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 -translate-y-1' 
                      : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="group relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/50 bg-card text-sm font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES_DATA.map((template) => (
              <Link 
                key={template.slug} 
                href={`/templates/${template.slug}`}
                className="group flex flex-col h-full rounded-[2.5rem] border border-border/50 bg-card transition-all hover:shadow-2xl hover:border-primary/40 hover:-translate-y-2 overflow-hidden"
              >
                <div className="aspect-[16/10] w-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden relative border-b border-border/50">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent group-hover:opacity-50 transition-opacity" />
                   {/* Fallback pattern since real images don't exist yet */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/40 group-hover:scale-110 group-hover:text-primary/50 transition-all duration-500">
                         <FileText className="h-8 w-8" />
                      </div>
                   </div>
                   <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <span className="px-3 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                        {template.downloadFormat}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                        <Download className="h-4 w-4" />
                      </div>
                   </div>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {template.category}
                  </div>
                  <h3 className="mb-4 text-xl font-black leading-tight tracking-tight group-hover:text-primary transition-colors">
                    {template.title}
                  </h3>
                  <p className="mb-8 flex-1 text-sm text-muted-foreground font-medium leading-relaxed line-clamp-2">
                    {template.shortDescription}
                  </p>
                  <div className="pt-6 border-t border-border/50 flex items-center justify-between">
                     <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold">
                             {i}
                          </div>
                        ))}
                     </div>
                     <div className="text-[10px] font-bold text-muted-foreground">
                        Used by 200+ schools
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
