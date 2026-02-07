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
    <Section className="bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden" id="features">
      <Container>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl mb-6">
            Everything you need to run a <span className="text-primary italic">modern</span> school.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
            One unified operating system. Replaces 10+ disconnected tools.
          </p>
        </motion.div>

        <Tabs defaultValue="academics" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12 overflow-x-auto pb-4 scrollbar-hide">
            <TabsList className="h-auto p-1 bg-muted/50 rounded-full border">
              {CATEGORIES.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="rounded-full px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {FEATURES_DATA.filter(f => f.category === category.id).map((feature, i) => (
                    <motion.div 
                      key={feature.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -5 }}
                      className={cn(
                        "group relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm transition-all hover:shadow-xl cursor-pointer hover:border-primary/20",
                      )}
                      onClick={() => window.location.href = `/features/${feature.slug}`}
                    >
                      {/* Hover Gradient */}
                      <div className={cn(
                        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity",
                        feature.color.replace('bg-', 'from-').replace('500', '500/20')
                      )} />

                      <div className="relative z-10">
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg mb-6 group-hover:scale-110 transition-transform",
                          feature.color
                        )}>
                          <IconMapper name={feature.icon} size={24} />
                        </div>

                        <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        
                        <p className="text-muted-foreground leading-relaxed text-sm mb-6 line-clamp-3">
                          {feature.description}
                        </p>

                        <div className="space-y-2 mb-6">
                          {feature.benefits.slice(0, 2).map((benefit, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center text-sm font-semibold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          Learn more <ArrowRight className="ml-1 h-4 w-4" />
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
