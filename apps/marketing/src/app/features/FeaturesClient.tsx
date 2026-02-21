"use client";

import React, { useState, useMemo } from 'react';
import { FEATURES_DATA, Container, Section, IconMapper } from '@schoolerp/ui';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, ChevronRight, Zap } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Modules' },
  { value: 'finance', label: 'Fees & Accounts' },
  { value: 'academics', label: 'Academics & Exams' },
  { value: 'communication', label: 'Parent Communication' },
  { value: 'safety', label: 'Safety & Ops' },
  { value: 'platform', label: 'Admin & Reports' },
  { value: 'ai', label: 'AI Assistants' }
];

export function FeaturesClient() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = useMemo(() => {
    let filtered = FEATURES_DATA;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(f => f.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [activeCategory, searchQuery]);

  return (
    <div className="bg-background">
      <Section spacing="large" className="bg-muted/30 pt-32 pb-16">
        <Container>
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">
              A Complete <span className="text-primary italic">Operating System</span> for Schools
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Explore 20+ purpose-built modules designed specifically for Indian budget and private schools.
            </p>
            
            <div className="relative max-w-lg mx-auto mt-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search for fees, attendance, report cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border border-border/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm text-lg"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="default" className="py-8 sticky top-16 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <Container>
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.value 
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="default" className="min-h-[500px]">
        <Container>
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <div className="inline-flex h-16 w-16 mb-4 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium">No modules found matching your search.</p>
              <button 
                onClick={() => {setSearchQuery(''); setActiveCategory('all');}}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link 
                    href={`/features/${feature.slug}`}
                    className="group flex flex-col h-full bg-card border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Add-on Badge */}
                    {feature.tier === 'addon' && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-950 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Paid Add-on
                      </div>
                    )}
                    
                    <div className="absolute -right-8 -top-8 w-32 h-32 opacity-10 group-hover:scale-150 group-hover:opacity-20 transition-all duration-500 rounded-full blur-2xl" style={{ backgroundColor: `var(--${feature.color.replace('bg-', '')})` }} />

                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg ${feature.color}`}>
                      <IconMapper name={feature.icon} size={28} />
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                       <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground group-hover:text-primary transition-colors">{feature.category}</span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground font-medium text-sm mb-6 flex-grow line-clamp-3">
                      {feature.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-border flex items-center font-bold text-sm text-foreground/80 group-hover:text-primary transition-colors">
                      Explore Module <ChevronRight className="ml-1.5 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
