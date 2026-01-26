"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Container, Section } from './layout-foundation';
import { IconMapper } from './icon-mapper';
import { ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

import { FEATURES_DATA } from '../data/features';

const BENTO_PATTERN = [
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
];

const FEATURES = FEATURES_DATA.map((f, i) => ({
  ...f,
  className: BENTO_PATTERN[i % BENTO_PATTERN.length]
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    } as any,
  },
};

export const FeatureGrid = () => {
  return (
    <Section className="bg-muted/30 overflow-hidden" id="features">
      <Container>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Modern tools for <span className="text-primary italic">elite</span> education.
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            A unified core to manage academics, finance, and safety without the chaos of legacy software.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]"
        >
          {FEATURES.map((feature, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => window.location.href = `/features/${feature.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-xl cursor-pointer",
                feature.className
              )}
            >
              {/* Subtle gradient glow on hover */}
              <div className={cn(
                "absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-0 transition-opacity group-hover:opacity-20",
                feature.color
              )} />
              
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg",
                    feature.color
                  )}>
                    <IconMapper name={feature.icon} size={24} />
                  </div>
                  <h3 className="mt-6 text-2xl font-bold tracking-tight">{feature.title}</h3>
                </div>
                <div className="flex justify-between items-end">
                  <p className="mt-2 text-muted-foreground leading-relaxed max-w-[80%] line-clamp-2">
                    {feature.description}
                  </p>
                  <div className="p-2 rounded-full bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
};


