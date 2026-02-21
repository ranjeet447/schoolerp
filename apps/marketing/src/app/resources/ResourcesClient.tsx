"use client";

import React, { useState, useMemo } from "react";
import { RESOURCES_DATA, Container, Section, ResourceItem, ResourceCategory } from "@schoolerp/ui";
import { motion } from "framer-motion";
import { Search, Download, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

const CATEGORIES: (ResourceCategory | 'All')[] = ['All', 'Guide', 'Template', 'Checklist', 'Policy'];

export function ResourcesClient() {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = RESOURCES_DATA;
    if (activeCategory !== 'All') {
      result = result.filter(r => r.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  return (
    <div className="bg-background">
      <Section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        
        <Container className="relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-8 backdrop-blur-xl">
              School Growth Vault
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95] mb-8">
              Free Resources for <br />
              <span className="text-primary italic">Better Schooling</span>.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/80 font-medium leading-relaxed max-w-2xl mx-auto mb-12">
              Download board-compliant checklists, policy templates, and digital transformation guides built for Indian schools.
            </p>
            
            <div className="relative max-w-lg mx-auto mb-12">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search resources (e.g. CBSE, fee policy)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border border-border/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    activeCategory === cat 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>

      <Section className="py-12">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((resource, i) => (
              <ResourceCard key={resource.id} resource={resource} index={i} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted">
               <p className="text-muted-foreground font-medium">No resources found matching your search. Try another keyword.</p>
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}

function ResourceCard({ resource, index }: { resource: ResourceItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Link 
        href={`/resources/${resource.slug}`}
        className="group relative flex flex-col h-full rounded-[2.5rem] border border-border/40 bg-card p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-2 overflow-hidden"
      >
        <div className={`mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${resource.color} text-white shadow-xl group-hover:rotate-6 transition-transform`}>
           <FileText className="w-7 h-7" />
        </div>
        
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
            {resource.category}
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight mb-4 group-hover:text-primary transition-colors">
            {resource.title}
          </h3>
          <p className="text-muted-foreground font-medium leading-relaxed line-clamp-3">
            {resource.description}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between pt-6 border-t border-border/40">
           <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/70">
              Free Access
           </span>
           <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
              Read More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </div>
        </div>
      </Link>
    </motion.div>
  );
}
