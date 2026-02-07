"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { IconMapper } from './icon-mapper';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { FEATURES_DATA, FeatureCategory } from '../data/features';

const CATEGORIES: { id: FeatureCategory; label: string }[] = [
  { id: 'academics', label: 'Academics & Learning' },
  { id: 'finance', label: 'Finance & HR' },
  { id: 'safety', label: 'Safety & Access' },
  { id: 'communication', label: 'Communication' },
  { id: 'platform', label: 'Platform & Automation' },
];

export const FeatureTabs = () => {
  const [activeTab, setActiveTab] = useState<string>('academics');

  return (
    <Section className="bg-muted/10 overflow-hidden" id="features">
      <Container>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl text-center mb-12 md:mb-16"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary shadow-sm border border-primary/10">
            Comprehensive Suite
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl mb-8 leading-[0.95]">
            Everything you need to run a <br />
            <span className="text-primary italic px-2">high-performance</span> school.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            One unified operating system that Replaces 10+ disconnected tools with a premium, audit-ready experience.
          </p>
        </motion.div>

        <Tabs defaultValue="academics" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-16 overflow-x-auto pb-4 scrollbar-hide">
            <TabsList className="h-auto p-1.5 bg-muted/30 backdrop-blur-xl rounded-full border border-white/10 shadow-inner">
              {CATEGORIES.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl data-[state=active]:shadow-primary/30"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            {CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-0 focus-visible:outline-none">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {FEATURES_DATA.filter(f => f.category === category.id).map((feature, i) => (
                    <motion.div 
                      key={feature.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "group relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/50 p-8 shadow-sm backdrop-blur-3xl transition-all duration-500 hover:shadow-[0_24px_64px_-16px_rgba(139,92,246,0.15)] hover:border-primary/30 hover:-translate-y-2 cursor-pointer",
                      )}
                      onClick={() => window.location.href = `/features/${feature.slug}`}
                    >
                      {/* Gradient Ambient Background */}
                      <div className={cn(
                        "absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-[60px]",
                        feature.color.replace('bg-', 'from-').replace('500', '500')
                      )} />

                      <div className="relative z-10">
                        <div className={cn(
                          "flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500",
                          feature.color,
                          "text-white"
                        )}>
                          <IconMapper name={feature.icon} size={32} />
                        </div>

                        <h3 className="text-2xl font-black tracking-tight mb-4 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        
                        <p className="text-muted-foreground leading-relaxed text-sm mb-8 font-medium">
                          {feature.description}
                        </p>

                        <div className="space-y-3 mb-8">
                          {feature.benefits.slice(0, 3).map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80 lowercase italic">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 not-italic" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary opacity-30 group-hover:opacity-100 transition-all duration-300">
                          Deep Dive <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </Container>
    </Section>
  );
};
